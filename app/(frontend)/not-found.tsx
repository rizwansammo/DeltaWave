import { ButtonLink, Eyebrow } from "@/components/site/shared";
export default function NotFound() {
  return (
    <section className="container not-found">
      <Eyebrow>404 / Page not found</Eyebrow>
      <h1>A different direction.</h1>
      <p>
        The page you are looking for is not here. Let’s get you back to
        something useful.
      </p>
      <ButtonLink href="/">Back to home</ButtonLink>
    </section>
  );
}
