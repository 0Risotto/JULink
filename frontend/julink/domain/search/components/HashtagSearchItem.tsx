import { HashtagSearchResultDTO } from "../types";

interface Props {
  hashtag: HashtagSearchResultDTO;
}

export default function HashtagSearchItem({ hashtag }: Props) {
  return (
    <div className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer mb-2">
      <p className="font-semibold text-sm text-primary">#{hashtag.name}</p>
    </div>
  );
}