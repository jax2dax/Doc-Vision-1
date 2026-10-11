import { SimpleForm } from "@/components/simple-form";

export const metadata = { title: "Form 1" };

export default function Form1Page() {
  return <SimpleForm title="Form 1" description="This form is marked as a conversion." conversion />;
}
