import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { ChatStatus, UIMessage } from "ai";
import { Copy, MessageCircle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import robot from "./assets/adjutant-robot.png.asset.json";
import { askAdjutant, askAdjutantSignedIn } from "./adjutant.functions";
import { chatEvent } from "./adjutant-contract";

export default function Adjutant({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const active = useRef<AbortController | null>(null);
  const publicAsk = useServerFn(askAdjutant);
  const privateAsk = useServerFn(askAdjutantSignedIn);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => () => { active.current?.abort(); }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const controller = new AbortController();
    active.current = controller;
    const userMessage: UIMessage = { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: question }] };
    const history = [...messages, userMessage];
    const answerId = crypto.randomUUID();
    setMessages(history);
    setDraft("");
    setError("");
    setStatus("submitted");
    input.current?.focus();
    let answer = "";
    try {
      const response = await (signedIn ? privateAsk : publicAsk)({ data: {
        messages: history.filter(m => m.parts.some(p => p.type === "text" && p.text.trim()))
          .slice(-60).map(m => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const,
            content: m.parts.map(p => p.type === "text" ? p.text : "").join("") })),
      }, signal: controller.signal });
      if (!response.ok || !response.body) throw new Error("Adjutant is unavailable. Please try again when ready.");
      const reader = response.body.getReader();
      controller.signal.addEventListener("abort", () => { void reader.cancel(); }, { once: true });
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!controller.signal.aborted) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = chatEvent.parse(JSON.parse(line));
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "done") done = true;
          if (event.type === "text") {
            answer += event.text;
            const textPart = answer;
            setStatus("streaming");
            setMessages([...history, { id: answerId, role: "assistant", parts: [{ type: "text", text: textPart }] }]);
          }
        }
      }
      if (!done && !controller.signal.aborted) throw new Error("The answer was interrupted. Please try again when ready.");
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : "Adjutant is unavailable. Please try again when ready.");
        setDraft(question);
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setStatus("ready");
        input.current?.focus();
      }
    }
  }

  function reset() {
    active.current?.abort();
    active.current = null;
    setMessages([]); setDraft(""); setError(""); setStatus("ready");
    input.current?.focus();
  }

  return (
    <div className="adjutant-shell">
      {!open && <Button className="adjutant-launch" onClick={() => setOpen(true)} aria-label="Open Adjutant">
        <img src={robot.url} alt="" /><span>Adjutant</span><MessageCircle size={18} />
      </Button>}
      {open && <section className="adjutant-window" role="dialog" aria-label="Adjutant assistant" onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
        <header className="adjutant-header">
          <img src={robot.url} alt="Adjutant robot" />
          <div><h2>Adjutant</h2><span>RMACTS Learning Hub</span></div>
          <Button size="icon" variant="ghost" title="New chat" aria-label="New chat" onClick={reset}><RotateCcw size={18} /></Button>
          <Button size="icon" variant="ghost" title="Close Adjutant" aria-label="Close Adjutant" onClick={() => setOpen(false)}><X size={20} /></Button>
        </header>
        <Conversation className="adjutant-transcript">
          <ConversationContent className="gap-5">
            {messages.length === 0 && <div className="adjutant-welcome"><img src={robot.url} alt="" /><h3>Hello, I’m Adjutant.</h3><p>What would you like to know?</p></div>}
            {messages.map(message => <Message key={message.id} from={message.role}>
              <MessageContent>{message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null)}</MessageContent>
              {message.role === "assistant" && !busy && <MessageActions><MessageAction tooltip="Copy answer" onClick={() => { void navigator.clipboard.writeText(message.parts.map(p => p.type === "text" ? p.text : "").join("")); }}><Copy size={14} /></MessageAction></MessageActions>}
            </Message>)}
            {status === "submitted" && <Shimmer>Adjutant is thinking…</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="adjutant-composer">
          {error && <p role="alert" className="adjutant-error">{error}</p>}
          <PromptInput onSubmit={({ text }) => send(text)}>
            <PromptInputTextarea ref={input} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ask Adjutant…" aria-label="Ask Adjutant" maxLength={12000} />
            <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} disabled={!busy && !draft.trim()} onStop={() => active.current?.abort()} /></PromptInputFooter>
          </PromptInput>
        </div>
      </section>}
    </div>
  );
}