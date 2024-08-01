import { useCallback, useEffect, useState } from 'react'
import ContentstackAppSdk from '@contentstack/app-sdk'

const FIELD_URL = 'url'
const ERROR_MESSAGE = 'This extension can only be used inside Contentstack.'

const contentStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#6b5ce7',
}

const getHrefUrl = (branch: string) => {
  switch (branch) {
    case 'main': {
      return 'https://supportcenter.corp.google.com'
    }
    default: {
      return 'https://supportcenter-staging.corp.google.com'
    }
  }
}

const getClearUrl = (url: string) => url.replace(/\?.*$/, "");

function App() {
  const [error, setError] = useState<any>(null);
  const [app, setApp] = useState({} as any);
  const [isSaved, setIsSaved] = useState(true);
  const [url, setUrl] = useState('');
  const [entryUid, setEntryUid] = useState('');
  const [branchName, setBranch] = useState('');

  const setEntryUidAndLog = (entry: any) => {
    setEntryUid(entry?._data?.uid);
    console.log("🚀 Entry UID:", entry?._data?.uid);
  }

  const initializeApp = useCallback(async () => {
    if (!app) {
      console.log("🚀 Waiting for app.");
      return;
    }

    const customField = await app?.location?.CustomField;

    if (customField) {

      customField?.frame?.updateHeight();
      customField?.frame?.enableAutoResizing();

      const entry = customField?.entry;
      const url = getClearUrl(customField?.entry.getData().url);
      setUrl(url)
      // Set the branch.
      const branch = app?.stack?.getCurrentBranch()?.uid ?? 'main';
      setBranch(branch);
      const appendToUrl = `?origin=gcp-na-app.contentstack.com&branch=${branch}`;

      // Set the entry uid.
      setEntryUidAndLog(entry)

      // Entry is not a template, set the URL field on form load.
      customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(url + appendToUrl);
      
      entry?.onChange((data: any) => {
        console.log("🚀 Entry changed, UID is:", entry?._data?.uid)
        entry.getField(FIELD_URL)?.setData(url + appendToUrl)
      });

      entry?.onSave(async () => {
          // Do not set URL field if starting from a template on the first save.
          const cleanUrl = getClearUrl(customField?.entry?.getData()?.url);
          const entryCustomField = customField?.entry;
          console.log(entryCustomField.getField("url"))
          entryCustomField.getField("url")?.setData(cleanUrl);
          setUrl(url)
          const newEntry = entryCustomField.getData();
          newEntry.url = cleanUrl;
          const payload = {
            entry: newEntry
          };
          setIsSaved(false);
          try {
            await app.stack.ContentType(entryCustomField?.content_type?.uid).Entry(newEntry.uid).update(payload);
          } catch (err) {
            console.log("🚀 ~ entry?.onSave ~ err:", err)
          }
      })
    } else {
      console.log('Custom field not yet loaded...')
    }
  }, [app])


  useEffect(() => {
    if (typeof window !== 'undefined' && window.self === window.top) {
      setError(ERROR_MESSAGE)
    } else {
      ContentstackAppSdk.init()
        .then((appSdk) => {
          setApp(appSdk);
        })
        .catch((err) => {
          console.error("Error initializing SDK: ", err);
        });
    }
  }, [])


  useEffect(() => {
    initializeApp()
  }, [initializeApp])
  
  let kms_url_not_available_message = (entryUid)
    ? 'Save entry to view KMS link.'
    : 'Save entry to view KMS link.'

  const return_value = (url)
    ? <>
        <base href={getHrefUrl(branchName)} />
        <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
      </>
    : <p>{kms_url_not_available_message}</p>

  return error
    ? <h3>{error}</h3>
    : <div style={contentStyle}>{return_value}</div>
}

export default App