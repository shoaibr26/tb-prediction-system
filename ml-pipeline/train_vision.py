import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import numpy as np

def train_vision_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data', 'images')
    
    # Check if dataset exists
    if not os.path.exists(data_dir) or len(os.listdir(data_dir)) == 0:
        print("Dataset not found. Please run download_data.py first.")
        return

    IMG_SIZE = (224, 224)
    BATCH_SIZE = 16

    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=15,
        zoom_range=0.1
    )

    train_generator = datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='training'
    )

    val_generator = datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation'
    )

    print(f"Classes: {train_generator.class_indices}")

    # Build model
    base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
    base_model.trainable = False  # Freeze base model

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.5)(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(1, activation='sigmoid')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
                  loss='binary_crossentropy',
                  metrics=['accuracy', tf.keras.metrics.AUC()])

    print("Training MobileNetV2 Vision Model...")
    
    # Set epochs carefully - usually small for demonstration unless real training is required
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=5
    )

    model_path = os.path.join(base_dir, 'vision_model.h5')
    model.save(model_path)
    print(f"Vision model saved to {model_path}")

if __name__ == '__main__':
    train_vision_model()
