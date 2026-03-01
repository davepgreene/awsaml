import { useState, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { Button, Input } from 'reactstrap';
import styled from 'styled-components';

const FullSizeLabel = styled.label`
  width: 100%;
  padding-bottom: 1rem;
`;

interface ConfigureMetadataProps {
  setError: (error: string) => void;
  setMetadataUrlValid: (valid: boolean) => void;
}

function ConfigureMetadata({ setError, setMetadataUrlValid }: ConfigureMetadataProps) {
  const [metadataUrl, setMetadataUrl] = useState('');
  const [profileName, setProfileName] = useState('');
  const [urlGroupClass, setUrlGroupClass] = useState('form-group');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    (async () => {
      const { url, name } = await window.electronAPI.getDefaultMetadata();
      setMetadataUrl(url);
      setProfileName(name);

      const dm = await window.electronAPI.getDarkMode();
      setDarkMode(dm);
    })();

    window.electronAPI.darkModeUpdated((_, value) => setDarkMode(value));
  }, []);

  const handleInputChange = ({ target: { name, value } }: ChangeEvent<HTMLInputElement>) => {
    if (name === 'profileName') setProfileName(value);
    else if (name === 'metadataUrl') setMetadataUrl(value);
  };

  const handleSubmit = async (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();

    const { error, redirect, metadataUrlValid } = await window.electronAPI.login({
      metadataUrl,
      profileName,
    });

    if (error) {
      setError(error);
      setMetadataUrlValid(metadataUrlValid ?? true);
      setUrlGroupClass('form-group has-error');
    }

    if (redirect) document.location.replace(redirect);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13) handleSubmit(event);
  };

  return (
    <fieldset>
      <legend>Configure</legend>
      <div className={urlGroupClass}>
        <FullSizeLabel htmlFor="metadataUrl">
          SAML Metadata URL
          <Input
            className="form-control"
            id="metadataUrl"
            name="metadataUrl"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            pattern="https://.+"
            required
            type="url"
            value={metadataUrl}
          />
        </FullSizeLabel>
      </div>
      <div className="form-group">
        <FullSizeLabel htmlFor="profileName">
          Account Alias
          <Input
            className="form-control"
            id="profileName"
            name="profileName"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            pattern=".+"
            type="text"
            value={profileName}
          />
        </FullSizeLabel>
      </div>
      <Button color="primary" onClick={handleSubmit} outline={!darkMode}>
        Done
      </Button>
    </fieldset>
  );
}

export default ConfigureMetadata;
