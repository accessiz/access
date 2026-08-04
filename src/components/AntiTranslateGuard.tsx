'use client';

import { useEffect } from 'react';

/**
 * AntiTranslateGuard prevents React from crashing with NotFoundError
 * when browser auto-translators (like Google Translate or Safari Translate)
 * mutate DOM text nodes underneath React's Virtual DOM reconciliation.
 */
export function AntiTranslateGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Polyfill insertBefore to prevent DOMException if referenceNode was modified by translation extensions
    if (typeof Node !== 'undefined' && Node.prototype.insertBefore) {
      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
        if (referenceNode && referenceNode.parentNode !== this) {
          // Fallback gracefully without crashing React
          return originalInsertBefore.call(this, newNode, null) as T;
        }
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
      };
    }

    // 2. Polyfill removeChild to prevent NotFoundError when translation wrappers replace text nodes
    if (typeof Node !== 'undefined' && Node.prototype.removeChild) {
      const originalRemoveChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function <T extends Node>(child: T): T {
        if (child.parentNode !== this) {
          // If child node was detached by external translation script, silently return
          return child;
        }
        return originalRemoveChild.call(this, child) as T;
      };
    }

    // 3. Ensure translate="no" on root document body to discourage external auto-translation
    document.documentElement.setAttribute('translate', 'no');
    document.body.setAttribute('translate', 'no');
    document.body.classList.add('notranslate');

  }, []);

  return null;
}
