import { PASSWORD_RULES, isOldEnough, profileBirthdayRule, signUpBirthdayRule } from "@/utils/formRules";

const symbolRule = PASSWORD_RULES.find((rule) => rule.label === "A symbol");

test("the symbol rule counts the symbols the server accepts", () => {
  ["!", "_", "\\", " ", "£", "[", "]", "?"].forEach((symbol) => expect(symbolRule.isMet(`Passwor1${symbol}`)).toBe(true));
});

test("accented letters and other characters the server refuses are not symbols", () => {
  ["é", "€", "ß", "😀"].forEach((character) => expect(symbolRule.isMet(`Passwor1${character}`)).toBe(false));
});

const yearsAgo = (years, dayShift = 0) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setDate(date.getDate() + dayShift);
  return date.toLocaleDateString("en-CA");
};

test("sign up needs a birthday, and says nothing about age until the form is sent", async () => {
  await expect(signUpBirthdayRule.validate("")).rejects.toThrow("Birthday required");
  await expect(signUpBirthdayRule.isValid(yearsAgo(5))).resolves.toBe(true);
  expect(isOldEnough(yearsAgo(13))).toBe(true);
  expect(isOldEnough(yearsAgo(13, 1))).toBe(false);
});

test("the profile refuses a young age, and a saved birthday can be changed but not removed", async () => {
  await expect(profileBirthdayRule.validate(yearsAgo(5))).rejects.toThrow("You must be at least 13 to use Whisprl");
  await expect(profileBirthdayRule.isValid("", { context: { hasBirthday: false } })).resolves.toBe(true);
  await expect(profileBirthdayRule.validate("", { context: { hasBirthday: true } })).rejects.toThrow("Your birthday can be changed, not removed");
});

test("dates that do not exist, come before 1900 or have not happened are refused", async () => {
  for (const value of ["1995-02-30", "1899-12-31", "invalid"]) await expect(signUpBirthdayRule.validate(value)).rejects.toThrow("That date doesn't exist");
  await expect(signUpBirthdayRule.validate(yearsAgo(-1))).rejects.toThrow("A birthday can't be in the future");
});
