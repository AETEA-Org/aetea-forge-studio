import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSupport } from "./SupportContext";
import { SupportForm } from "./SupportForm";

const TITLE = "How can we help?";
const DESCRIPTION = "Tell us what happened. We reply by email.";

/**
 * The panel, identical on every surface.
 *
 * A centred Dialog on desktop and the same content as a bottom sheet on a
 * phone. Dialog sits at z-[80], above the copilot panel's z-[60], which is
 * what keeps it usable on the campaign view where the conversation owns the
 * entire right-hand edge.
 */
export function SupportDialog() {
  const { isOpen, close } = useSupport();
  const isMobile = useIsMobile();
  const onOpenChange = (next: boolean) => { if (!next) close(); };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display">{TITLE}</DrawerTitle>
            <DrawerDescription>{DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <SupportForm onDone={close} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{TITLE}</DialogTitle>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <SupportForm onDone={close} />
      </DialogContent>
    </Dialog>
  );
}
