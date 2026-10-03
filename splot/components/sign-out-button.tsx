export function SignOutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button type="submit" className="min-h-11 px-3 font-bold underline underline-offset-4">
        Wyloguj się
      </button>
    </form>
  );
}
