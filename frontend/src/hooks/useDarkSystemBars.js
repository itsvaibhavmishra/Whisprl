import { useEffect } from "react";

import { holdDarkSystemBars } from "@/utils/systemBars";

const useDarkSystemBars = () => useEffect(holdDarkSystemBars, []);

export default useDarkSystemBars;
