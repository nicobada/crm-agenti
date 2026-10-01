import { redirect } from 'next/navigation';

export default function DocumentsUploadRedirect() {
  redirect('/dashboard/upload');
}
