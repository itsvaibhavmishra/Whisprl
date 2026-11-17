export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "undisclosed", label: "Prefer not to say" },
];

export const genderLabelOf = (gender) => GENDERS.find((choice) => choice.value === gender)?.label;

// prefer not to say is a choice to keep it off the profile, so only the other two are ever shown
export const shownGenderOf = (gender) => (gender === "undisclosed" ? null : genderLabelOf(gender));
