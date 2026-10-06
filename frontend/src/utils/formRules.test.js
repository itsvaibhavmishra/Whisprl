import { PASSWORD_RULES } from "@/utils/formRules";

const symbolRule = PASSWORD_RULES.find((rule) => rule.label === "A symbol");

test("the symbol rule counts the symbols the server accepts", () => {
  ["!", "_", "\\", " ", "£", "[", "]", "?"].forEach((symbol) => expect(symbolRule.isMet(`Passwor1${symbol}`)).toBe(true));
});

test("accented letters and other characters the server refuses are not symbols", () => {
  ["é", "€", "ß", "😀"].forEach((character) => expect(symbolRule.isMet(`Passwor1${character}`)).toBe(false));
});
