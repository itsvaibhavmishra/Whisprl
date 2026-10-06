import { useSelector } from "react-redux";

import { selectIsLoading } from "@/redux/slices/requestSlice";

const useIsLoading = (thunk, subject) => useSelector((state) => selectIsLoading(state, thunk, subject));

export default useIsLoading;
