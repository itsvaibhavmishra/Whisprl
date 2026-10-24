import DocPage from "@/components/DocPage";
import { INTRO, LAST_UPDATED, SECTIONS } from "@/sections/delete-account/content";

const DeleteAccount = () => <DocPage title="Delete your Whisprl account" lastUpdated={LAST_UPDATED} intro={INTRO} sections={SECTIONS} />;

export default DeleteAccount;
