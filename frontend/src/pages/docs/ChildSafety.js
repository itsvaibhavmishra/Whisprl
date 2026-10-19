import DocPage from "@/components/DocPage";
import { INTRO, LAST_UPDATED, SECTIONS } from "@/sections/child-safety/content";

const ChildSafety = () => <DocPage title="Child safety standards" lastUpdated={LAST_UPDATED} intro={INTRO} sections={SECTIONS} />;

export default ChildSafety;
