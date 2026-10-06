import { linksIn, splitLinks } from "@/utils/links";

test("links are found with their trailing punctuation left out", () => {
  expect(linksIn("see https://whisprl.app/terms. and www.example.com!")).toEqual([
    { link: "https://whisprl.app/terms", href: "https://whisprl.app/terms" },
    { link: "www.example.com", href: "https://www.example.com" },
  ]);
});

test("text splits around links in reading order", () => {
  expect(splitLinks("go to https://a.io now")).toEqual([
    { text: "go to " },
    { text: "https://a.io", href: "https://a.io" },
    { text: " now" },
  ]);
  expect(splitLinks("no links here")).toEqual([{ text: "no links here" }]);
});
