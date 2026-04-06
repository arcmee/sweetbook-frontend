import { useState, type FormEvent, type ReactElement } from "react";

import { prototypeDemoCredentials, type PrototypeAuthSession } from "../../application/prototype-auth";
import { requestPrototypeAuthLogin } from "../../data/prototype-api-client";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type LoginScreenProps = {
  onLogin?: (session: PrototypeAuthSession) => void;
  requestLogin?: (input: {
    username: string;
    password: string;
  }) => Promise<PrototypeAuthSession>;
};

export function LoginScreen({
  onLogin,
  requestLogin = requestPrototypeAuthLogin,
}: LoginScreenProps): ReactElement {
  const [username, setUsername] = useState(prototypeDemoCredentials.username);
  const [password, setPassword] = useState(prototypeDemoCredentials.password);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = await requestLogin({ username, password });
      onLogin?.(session);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageSection
      eyebrow="Prototype auth"
      title="Sign in to SweetBook"
      description="Use the prototype demo account to unlock the protected workspace routes."
    >
      <form onSubmit={handleSubmit}>
        <label>
          ID
          <input
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <PrimaryAction
          label={isSubmitting ? "Signing in..." : "Sign in"}
          disabled={isSubmitting}
          type="submit"
        />
      </form>
      <StatePanel
        tone="empty"
        title="Prototype demo credentials"
        description={`Use ${prototypeDemoCredentials.username} / ${prototypeDemoCredentials.password}`}
      />
      {errorMessage ? (
        <StatePanel
          tone="error"
          title="Prototype sign-in failed"
          description={errorMessage}
        />
      ) : null}
    </PageSection>
  );
}
