import { redirect } from "next/navigation";

// The application form itself lives on the marketing page, so this legacy route
// just points at it rather than keeping a second copy in sync.
export default function TutorApplyPage() {
  redirect("/become-a-tutor#apply");
}
