import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import NoticeText from "@/sections/chat/messages/NoticeText";

const htmlOf = (text) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <NoticeText text={text} />
    </MemoryRouter>
  );

test("links within the app become links, including a profile by its username", () => {
  expect(htmlOf("[invite](/contacts) or [see Mei](/contacts/@mei.chen)")).toMatch(/href="\/contacts".*href="\/contacts\/@mei.chen"/);
});

test("a path that would leave the app stays plain text", () => {
  expect(htmlOf("[prize](//example.com)")).not.toContain("href");
  expect(htmlOf("[prize](/\\example.com)")).not.toContain("href");
});
