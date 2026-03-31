import os
import csv
import random
import shutil

# Paths for HAM10000
METADATA_CSV = 'data/raw/ham10000/HAM10000_metadata.csv'
IMAGES_DIR = 'data/raw/ham10000'
DATA_DIR = 'data'

# HAM10000 classes mapping to our 2 classes
# Malignant: mel (Melanoma), bcc (Basal cell carcinoma), akiec (Actinic keratoses)
# Benign: nv (Melanocytic nevi), bkl (Benign keratosis), df (Dermatofibroma), vasc (Vascular lesions)
LABEL_MAPPING = {
    'mel': 'Malignant',
    'bcc': 'Malignant',
    'akiec': 'Malignant',
    'nv': 'Benign',
    'bkl': 'Benign',
    'df': 'Benign',
    'vasc': 'Benign'
}

def prepare_dataset():
    LABELS = ['Benign', 'Malignant']
    
    # Create directory structure
    for split in ['train', 'val']:
        for label in LABELS:
            os.makedirs(os.path.join(DATA_DIR, split, label), exist_ok=True)
            
    # Read metadata
    samples = [] # List of (image_id, label)
    if not os.path.exists(METADATA_CSV):
        print(f"Error: {METADATA_CSV} not found! Please run download_ham10000.py first.")
        return

    with open(METADATA_CSV, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            original_label = row['dx']
            if original_label in LABEL_MAPPING:
                mapped_label = LABEL_MAPPING[original_label]
                image_id = row['image_id']
                samples.append((image_id, mapped_label))
                
    print(f"Total valid samples found: {len(samples)}")
    
    # Shuffle and split
    random.shuffle(samples)
    split_idx = int(0.8 * len(samples))
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]
    
    # Copy/Symlink images
    def process_samples(sample_list, split):
        count = 0
        missing = 0
        for image_id, label in sample_list:
            # Images in HAM10000 are named with .jpg
            src = os.path.join(IMAGES_DIR, f"{image_id}.jpg")
            dst = os.path.join(DATA_DIR, split, label, f"{image_id}.jpg")
            
            if os.path.exists(src):
                if not os.path.exists(dst):
                    try:
                        shutil.copy2(src, dst)
                        count += 1
                    except Exception as e:
                        print(f"Error copying {image_id}: {e}")
            else:
                missing += 1
                
        print(f"Finished {split}: {count} images copied. {missing} missing.")

    print("Processing training samples...")
    process_samples(train_samples, 'train')
    print("Processing validation samples...")
    process_samples(val_samples, 'val')
    print("Dataset preparation complete.")

if __name__ == "__main__":
    prepare_dataset()
