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
      const url = customField?.entry.getData().url;
      setUrl(url);

      // Set the branch.
      const branch = app?.stack?.getCurrentBranch()?.uid ?? 'main';
      setBranch(branch);

      // Set the entry uid.
      setEntryUidAndLog(entry)

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
  
  let kms_url_not_available_message = 'Save entry to view KMS link.'

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