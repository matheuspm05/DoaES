import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { ErrorMessage } from "./ui";

export default function PhotoPreview() {
  const urls = useRef([]);
  const [photos, setPhotos] = useState([]),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      urls.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [],
  );
  function add(e) {
    const files = Array.from(e.target.files);
    setError("");
    if (
      files.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Escolha imagens JPG, PNG ou WebP de até 5 MB cada.");
      e.target.value = "";
      return;
    }
    if (photos.length + files.length > 4) {
      setError("Selecione até 4 fotos para a prévia.");
      e.target.value = "";
      return;
    }
    const next = [
      ...photos,
      ...files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ];
    urls.current = next;
    setPhotos(next);
    e.target.value = "";
  }
  function remove(photo) {
    URL.revokeObjectURL(photo.url);
    const next = photos.filter((p) => p !== photo);
    urls.current = next;
    setPhotos(next);
  }
  return (
    <section className="photo-section">
      <h3>
        Fotos dos itens <span className="micro">opcional</span>
      </h3>
      <label className="photo-drop">
        <ImagePlus size={27} />
        <strong>Selecionar fotos para prévia</strong>
        <span>JPG, PNG ou WebP · até 4 imagens de 5 MB</span>
        <input
          aria-label="Fotos demonstrativas"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={add}
        />
      </label>
      <ErrorMessage>{error}</ErrorMessage>
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.url}>
              <img src={p.url} alt={`Prévia local: ${p.name}`} />
              <button
                type="button"
                aria-label={`Remover ${p.name}`}
                onClick={() => remove(p)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="micro">
        Somente prévia temporária neste navegador. As fotos não são enviadas nem
        armazenadas e serão descartadas ao sair desta tela.
      </p>
    </section>
  );
}
