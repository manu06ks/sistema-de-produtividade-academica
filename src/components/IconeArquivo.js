import { File, FileImage, FileSpreadsheet, FileText, Presentation } from 'lucide-react';

// Ícone pela categoria do arquivo (a coluna "tipo": PDF, Imagem, Documento...).
export default function IconeArquivo({ tipo, className }) {
  switch (tipo) {
    case 'Imagem':
      return <FileImage className={className} />;
    case 'Apresentação':
      return <Presentation className={className} />;
    case 'Planilha':
      return <FileSpreadsheet className={className} />;
    case 'PDF':
    case 'Documento':
    case 'Texto':
      return <FileText className={className} />;
    default:
      return <File className={className} />;
  }
}