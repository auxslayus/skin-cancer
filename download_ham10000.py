import os
import urllib.request
import zipfile

DATA_DIR = 'data/raw/ham10000'

FILES = {
    'HAM10000_metadata.csv': 'https://dataverse.harvard.edu/api/access/datafile/3172582',
    'HAM10000_images_part_1.zip': 'https://dataverse.harvard.edu/api/access/datafile/3172585',
    'HAM10000_images_part_2.zip': 'https://dataverse.harvard.edu/api/access/datafile/3172584'
}

def download_report(blocknum, blocksize, totalsize):
    readsofar = blocknum * blocksize
    if totalsize > 0:
        percent = readsofar * 1e2 / totalsize
        s = "\r%5.1f%% %*d / %d" % (
            percent, len(str(totalsize)), readsofar, totalsize)
        import sys
        sys.stdout.write(s)
        sys.stdout.flush()
        if readsofar >= totalsize: # near the end
            sys.stdout.write("\n")
    else: # total size is unknown
        import sys
        sys.stdout.write("read %d\n" % (readsofar,))
        sys.stdout.flush()

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Configure urllib to use a standard browser User-Agent to avoid 403 Forbidden
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36')]
    urllib.request.install_opener(opener)
    
    for filename, url in FILES.items():
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, filepath, download_report)
        else:
            print(f"{filename} already exists. Skipping download.")
            
        if filename.endswith('.zip'):
            print(f"Extracting {filename}...")
            with zipfile.ZipFile(filepath, 'r') as zip_ref:
                zip_ref.extractall(DATA_DIR)
            print(f"Removing {filepath} to save space...")
            os.remove(filepath)
            
    print("Download and extraction complete.")

if __name__ == '__main__':
    main()
