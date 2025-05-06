export function linkifyAirlines(text) {
    const urlRegex = /https?:\/\/[^\s)]+/g;
  
    return text.split('\n').map((line, index) => {
      const match = line.match(urlRegex);
  
      if (match) {
        const url = match[0];
        const before = line.split(url)[0];
  
        return (
          <p key={index} className="mb-2">
            {before}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline ml-1"
            >
              {url}
            </a>
          </p>
        );
      }
  
      return <p key={index} className="mb-2">{line}</p>;
    });
  }
  