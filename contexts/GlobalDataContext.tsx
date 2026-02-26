
import React, { createContext, useContext, useEffect, useState } from 'react';
// FIX: Update Firestore imports to use the centralized firebaseConfig.ts file.
import { collection, onSnapshot, query, db, where } from '../firebaseConfig';

interface GlobalData {
  textOverrides: Record<string, string>;
  imageOverrides: Record<string, string>;
  imageCredits: Record<string, string>; // Legacy ID-based credits
  urlCredits: Record<string, string>;   // New: URL-based credits for sync
  videoOverrides: Record<string, string>;
  linkOverrides: Record<string, string>;
  isLoading: boolean;
}

const GlobalDataContext = createContext<GlobalData>({
  textOverrides: {},
  imageOverrides: {},
  imageCredits: {},
  urlCredits: {},
  videoOverrides: {},
  linkOverrides: {},
  isLoading: true,
});

export const useGlobalData = () => useContext(GlobalDataContext);

export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const [imageCredits, setImageCredits] = useState<Record<string, string>>({}); // New
  const [urlCredits, setUrlCredits] = useState<Record<string, string>>({});
  const [videoOverrides, setVideoOverrides] = useState<Record<string, string>>({});
  const [linkOverrides, setLinkOverrides] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    // 1. Listen to Content Overrides (Text)
    const unsubText = onSnapshot(collection(db, 'contentOverrides'), (snap: any) => {
      const data: Record<string, string> = {};
      snap.forEach((doc: any) => { data[doc.id] = doc.data().text; });
      setTextOverrides(data);
    });

    // 2. Listen to Image Overrides (URL & Credits)
    const unsubImage = onSnapshot(collection(db, 'imageOverrides'), (snap: any) => {
      const urls: Record<string, string> = {};
      const credits: Record<string, string> = {};
      snap.forEach((doc: any) => { 
          const d = doc.data();
          urls[doc.id] = d.url; 
          if (d.credit) credits[doc.id] = d.credit;
      });
      setImageOverrides(urls);
      setImageCredits(credits);
    });

    // 3. Listen to Video Overrides
    const unsubVideo = onSnapshot(collection(db, 'videoOverrides'), (snap: any) => {
        const data: Record<string, string> = {};
        snap.forEach((doc: any) => { data[doc.id] = doc.data().url; });
        setVideoOverrides(data);
    });

    // 4. Listen to Link Overrides
    const unsubLink = onSnapshot(collection(db, 'linkOverrides'), (snap: any) => {
        const data: Record<string, string> = {};
        snap.forEach((doc: any) => { data[doc.id] = doc.data().url; });
        setLinkOverrides(data);
    });

    // 5. Listen to Media Assets for Global URL Credits
    // We only care about assets that have a credit set to reduce local memory usage slightly,
    // though fetching all is fine for this scale.
    // Use 'media_assets_gcloud' (or whatever is defined in storageService)
    const unsubGlobalCredits = onSnapshot(collection(db, 'media_assets_gcloud'), (snap: any) => {
        const map: Record<string, string> = {};
        snap.forEach((doc: any) => {
            const d = doc.data();
            if (d.url && d.credit) {
                map[d.url] = d.credit;
            }
        });
        setUrlCredits(map);
    });

    setIsLoading(false);

    return () => {
      unsubText();
      unsubImage();
      unsubVideo();
      unsubLink();
      unsubGlobalCredits();
    };
  }, []);

  return (
    <GlobalDataContext.Provider value={{ textOverrides, imageOverrides, imageCredits, urlCredits, videoOverrides, linkOverrides, isLoading }}>
      {children}
    </GlobalDataContext.Provider>
  );
};
