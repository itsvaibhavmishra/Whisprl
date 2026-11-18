import { largeAvatarOf, smallAvatarOf } from "@/utils/avatars";

test("a profile shows Whisprl's large picture and Google's photo at a bigger size", () => {
  expect(largeAvatarOf("/avatars/fox.webp")).toBe("/avatars/large/fox.webp");
  expect(largeAvatarOf("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe("https://lh3.googleusercontent.com/a/abc=s1024-c");
});

test("an upload, a picture being edited and no picture stay as they are", () => {
  expect(largeAvatarOf("https://res.cloudinary.com/demo/image/upload/photo.jpg")).toBe("https://res.cloudinary.com/demo/image/upload/photo.jpg");
  expect(largeAvatarOf("blob:http://localhost/123")).toBe("blob:http://localhost/123");
  expect(largeAvatarOf("")).toBe("");
});

test("a list asks for small copies, and Whisprl's own small file is already one", () => {
  expect(smallAvatarOf("https://res.cloudinary.com/demo/image/upload/v1/User Avatars/1/photo.jpg")).toBe(
    "https://res.cloudinary.com/demo/image/upload/c_fill,w_192,h_192,f_auto,q_auto/v1/User Avatars/1/photo.jpg"
  );
  expect(smallAvatarOf("https://lh3.googleusercontent.com/a/abc=s96-c")).toBe("https://lh3.googleusercontent.com/a/abc=s192-c");
  expect(smallAvatarOf("/avatars/fox.webp")).toBe("/avatars/fox.webp");
});
