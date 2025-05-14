
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Chat from './chat/Chat';

interface BillChatProps {
  billText: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const BillChat = ({ billText, isOpen, onClose }: BillChatProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl h-[80vh] p-0 flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <Chat billText={billText} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillChat;
