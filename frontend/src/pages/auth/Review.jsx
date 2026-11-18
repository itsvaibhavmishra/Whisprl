import AuthHeader from "@/sections/auth/AuthHeader";
import ReviewLoginForm from "@/sections/auth/ReviewLoginForm";

const Review = () => (
  <>
    <AuthHeader title="App review sign in">For Google Play&apos;s reviewers, with the account given in the review notes.</AuthHeader>
    <ReviewLoginForm />
  </>
);

export default Review;
