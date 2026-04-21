import { redirect } from "next/navigation";

export default function ClientSchedulesRedirect() {
  redirect("/client/crons");
}
