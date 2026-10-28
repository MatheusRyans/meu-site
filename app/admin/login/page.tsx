import { login } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="container page-section">
      <section className="section-block page-content">
        <article className="auth-card">
          <header>
            <h1>Login</h1>
          </header>

          {error ? (
            <p style={{ color: "#fca5a5", marginBottom: "16px" }}>
              {error === "invalid" ? "Senha incorreta." : "Preencha todos os dados obrigatórios."}
            </p>
          ) : null}

          <form action={login} className="contact-grid admin-login-form">
            <label className="contact-item admin-field">
              <span className="contact-label">Senha</span>
              <input
                type="password"
                name="password"
                placeholder="Digite a senha"
                autoComplete="current-password"
                className="admin-input"
              />
            </label>

            <button type="submit" className="primary-button">
              Entrar
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
