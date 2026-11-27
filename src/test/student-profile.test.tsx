import { describe, expect, it } from "vitest";
import { validateBioStep, type ProfileData } from "@/rmacts/StudentProfile";

const BASE: ProfileData = {
  surname: "",
  otherNames: "",
  serviceNumber: "",
  rate: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  address: "",
  about: "",
  hobbies: "",
  photoUrl: "",
  bioCompleted: false,
};

describe("Student bio data 4-step validation", () => {
  it("requires bio data fields on step 1 before advancing", () => {
    expect(validateBioStep(0, BASE, false)).toBeTruthy();
    expect(
      validateBioStep(
        0,
        { ...BASE, surname: "Mensah", otherNames: "Kwame", serviceNumber: "SN-01", rate: "Able Seaman" },
        false,
      ),
    ).toBeNull();
  });

  it("requires personal information fields on step 2 before advancing", () => {
    expect(validateBioStep(1, BASE, false)).toBeTruthy();
    expect(
      validateBioStep(
        1,
        { ...BASE, dateOfBirth: "2001-05-14", gender: "Male", phone: "+233240000000", about: "Maritime cadet" },
        false,
      ),
    ).toBeNull();
  });

  it("requires hobbies on step 3 before advancing", () => {
    expect(validateBioStep(2, BASE, false)).toBeTruthy();
    expect(validateBioStep(2, { ...BASE, hobbies: "Swimming, reading" }, false)).toBeNull();
  });

  it("requires a passport photograph on step 4 before finishing", () => {
    expect(validateBioStep(3, BASE, false)).toBeTruthy();
    expect(validateBioStep(3, BASE, true)).toBeNull();
  });
});