import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  persistent?: boolean;
  children: React.ReactNode;
  maxWidth?: string;
  "aria-labelledby"?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  persistent = false,
  children,
  maxWidth = "max-w-md",
  "aria-labelledby": labelledBy,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || persistent) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, persistent, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        aria-hidden="true"
        onClick={persistent ? undefined : onClose}
      />
      <div
        className={[
          "relative z-10 w-full rounded-2xl bg-white shadow-xl",
          "animate-[fadeInScale_0.18s_ease-out]",
          maxWidth,
        ].join(" ")}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
