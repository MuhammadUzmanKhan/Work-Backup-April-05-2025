// types.ts
export interface IndustryData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IndustriesModalProps {
  showModal: boolean;
  closeModal: () => void;
  data: IndustryData | null;
  fetchData: () => void;
}
