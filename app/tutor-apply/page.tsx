import { redirect } from "next/navigation";

export default function TutorApplyPage() {
  redirect("/login?mode=signup&role=tutor");
}
