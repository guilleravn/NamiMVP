import { ButtonLink } from '../components/Button';
import { PageTitle, Subtitle } from '../components/ui';
import { useDocumentTitle } from '../lib/hooks';

export function MissingPage({ backTo = '/', title = 'No encontramos esta página' }: { backTo?: string; title?: string }) {
  useDocumentTitle(title);
  return (
    <div className="py-8 text-center">
      <PageTitle>{title}</PageTitle>
      <Subtitle>Puede que el enlace esté mal o que los datos de la demo se hayan reiniciado.</Subtitle>
      <ButtonLink to={backTo}>Volver</ButtonLink>
    </div>
  );
}
