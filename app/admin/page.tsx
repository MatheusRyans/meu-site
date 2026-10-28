import { logout, saveEntry } from "@/app/admin/actions";
import { getAllContent } from "@/lib/content";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const defaultEntry = {
  title: "",
  slug: "",
  type: "blog",
  summary: "",
  category: "geral",
  tags: "",
  status: "published",
  publishedAt: new Date().toISOString().slice(0, 10),
  featured: "false",
  sourceUrl: "",
  language: "pt-BR",
  thumbnail: "",
  body: "",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; error?: string }>;
}) {
  await requireAdmin();

  const { item, error } = await searchParams;
  const entries = getAllContent();
  const selectedEntry = entries.find((entry) => entry.slug === item) ?? entries[0];

  const formValues = selectedEntry
    ? {
        title: selectedEntry.title,
        slug: selectedEntry.slug,
        type: selectedEntry.type,
        summary: selectedEntry.summary,
        category: selectedEntry.category,
        tags: selectedEntry.tags.join(", "),
        status: selectedEntry.status,
        publishedAt: selectedEntry.publishedAt,
        featured: String(selectedEntry.featured),
        sourceUrl: selectedEntry.sourceUrl ?? "",
        language: selectedEntry.language,
        thumbnail: selectedEntry.thumbnail ?? "",
        body: selectedEntry.body,
      }
    : defaultEntry;

  return (
    <div className="container page-section">
      <section className="section-block page-content">
        <article className="admin-shell">
          <header className="admin-topbar">
            <div>
              <h1>Gerenciar conteúdo</h1>
            </div>

            <form action={logout}>
              <button type="submit" className="secondary-button">
                Sair
              </button>
            </form>
          </header>

          <div className="admin-toolbar">
            <span>Conteúdo publicado e em rascunho</span>
          </div>

          {error ? (
            <p style={{ color: "#fca5a5", marginBottom: "16px" }}>
              {error === "missing-fields" ? "Preencha título, resumo, conteúdo e slug para salvar." : "Ocorreu um erro ao salvar o item."}
            </p>
          ) : null}

          <div className="contact-grid" style={{ marginTop: "0" }}>
            <div className="contact-item admin-selection-card">
              <span className="contact-label">Item selecionado</span>
              <form method="GET" action="/admin" className="admin-select-form">
                <select name="item" defaultValue={selectedEntry?.slug ?? ""} className="admin-select">
                  {entries.map((entry) => (
                    <option key={entry.slug} value={entry.slug}>
                      {entry.title}
                    </option>
                  ))}
                </select>
                <button type="submit" className="secondary-button admin-action-button">
                  Carregar item
                </button>
              </form>
            </div>
          </div>

          <form action={saveEntry} className="contact-grid admin-form">
            {selectedEntry ? <input type="hidden" name="existingFile" value={selectedEntry.slug} /> : null}

            <label className="contact-item admin-field">
              <span className="contact-label">Título</span>
              <input name="title" defaultValue={formValues.title} className="admin-input" />
            </label>

            <div className="admin-form-grid">
              <label className="contact-item admin-field">
                <span className="contact-label">Slug</span>
                <input name="slug" defaultValue={formValues.slug} className="admin-input" />
              </label>

              <label className="contact-item admin-field">
                <span className="contact-label">Tipo</span>
                <select name="type" defaultValue={formValues.type} className="admin-input admin-select-input">
                  <option value="blog">Blog</option>
                  <option value="youtube">YouTube</option>
                  <option value="playlist">Playlist</option>
                  <option value="website">Website</option>
                  <option value="github">GitHub</option>
                  <option value="collection">Collection</option>
                </select>
              </label>

              <label className="contact-item admin-field">
                <span className="contact-label">Categoria</span>
                <input name="category" defaultValue={formValues.category} className="admin-input" />
              </label>

              <label className="contact-item admin-field">
                <span className="contact-label">Status</span>
                <select name="status" defaultValue={formValues.status} className="admin-input admin-select-input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="contact-item admin-field">
                <span className="contact-label">Data</span>
                <input type="date" name="publishedAt" defaultValue={formValues.publishedAt} className="admin-input" />
              </label>

              <label className="contact-item admin-field">
                <span className="contact-label">Idioma</span>
                <select name="language" defaultValue={formValues.language} className="admin-input admin-select-input">
                  <option value="pt-BR">Português</option>
                  <option value="en">Inglês</option>
                </select>
              </label>
            </div>

            <label className="contact-item admin-field">
              <span className="contact-label">Resumo</span>
              <textarea name="summary" defaultValue={formValues.summary} rows={3} className="admin-input admin-textarea" />
            </label>

            <label className="contact-item admin-field">
              <span className="contact-label">Tags (separadas por vírgula)</span>
              <input name="tags" defaultValue={formValues.tags} className="admin-input" />
            </label>

            <label className="contact-item admin-field">
              <span className="contact-label">URL da fonte</span>
              <input name="sourceUrl" defaultValue={formValues.sourceUrl} className="admin-input" />
            </label>

            <label className="contact-item admin-field">
              <span className="contact-label">Thumbnail / imagem</span>
              <input name="thumbnail" defaultValue={formValues.thumbnail} className="admin-input" />
            </label>

            <label className="contact-item admin-field">
              <span className="contact-label">Destacar na homepage</span>
              <select name="featured" defaultValue={formValues.featured} className="admin-input admin-select-input">
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </label>

            <label className="contact-item admin-field">
              <span className="contact-label">Conteúdo</span>
              <textarea name="body" defaultValue={formValues.body} rows={18} className="admin-input admin-textarea admin-body-input" />
            </label>

            <button type="submit" className="primary-button">
              Salvar conteúdo
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
