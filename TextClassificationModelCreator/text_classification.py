import os
import re
import string
import tensorflow as tf
from tensorflow.keras import layers, losses
import matplotlib.pyplot as plt

# Constants
BATCH_SIZE = 32
SEED = 42
MAX_FEATURES = 10000
SEQUENCE_LENGTH = 250
EMBEDDING_DIM = 16
EPOCHS = 20

# Helper Functions
def load_dataset(data_dir, subset, batch_size, seed, validation_split=0.2):
    return tf.keras.utils.text_dataset_from_directory(
        data_dir,
        batch_size=batch_size,
        validation_split=validation_split,
        subset=subset,
        seed=seed
    )

def custom_standardization(input_data):
    lowercase = tf.strings.lower(input_data)
    stripped_html = tf.strings.regex_replace(lowercase, '<br />', ' ')
    return tf.strings.regex_replace(
        stripped_html,
        '[%s]' % re.escape(string.punctuation),
        ''
    )

def create_vectorize_layer(max_features, sequence_length, standardize_fn):
    return layers.TextVectorization(
        standardize=standardize_fn,
        max_tokens=max_features,
        output_mode='int',
        output_sequence_length=sequence_length
    )

def vectorize_text(text, label, vectorize_layer):
    text = tf.expand_dims(text, -1)
    return vectorize_layer(text), label

def prepare_dataset(dataset, vectorize_layer):
    return dataset.map(lambda x, y: vectorize_text(x, y, vectorize_layer)).cache().prefetch(buffer_size=tf.data.AUTOTUNE)

def build_model(max_features, embedding_dim):
    return tf.keras.Sequential([
        layers.Embedding(max_features, embedding_dim),
        layers.Dropout(0.2),
        layers.GlobalAveragePooling1D(),
        layers.Dropout(0.2),
        layers.Dense(1, activation='sigmoid')
    ])

def plot_metrics(history):
    history_dict = history.history
    acc = history_dict['binary_accuracy']
    val_acc = history_dict['val_binary_accuracy']
    loss = history_dict['loss']
    val_loss = history_dict['val_loss']

    epochs = range(1, len(acc) + 1)

    plt.figure(figsize=(14, 6))

    # Loss Plot
    plt.subplot(1, 2, 1)
    plt.plot(epochs, loss, 'bo', label='Training loss')
    plt.plot(epochs, val_loss, 'b', label='Validation loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()

    # Accuracy Plot
    plt.subplot(1, 2, 2)
    plt.plot(epochs, acc, 'bo', label='Training Accuracy')
    plt.plot(epochs, val_acc, 'b', label='Validation Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend(loc='lower right')

    plt.tight_layout()
    plt.show()

# Main Workflow
if __name__ == "__main__":
    # Load datasets
    raw_train_ds = load_dataset('TrainData', 'training', BATCH_SIZE, SEED)
    raw_val_ds = load_dataset('TrainData', 'validation', BATCH_SIZE, SEED)

    print("Label 0 corresponds to", raw_train_ds.class_names[0])
    print("Label 1 corresponds to", raw_train_ds.class_names[1])

    # Vectorization Layer
    vectorize_layer = create_vectorize_layer(MAX_FEATURES, SEQUENCE_LENGTH, custom_standardization)
    train_text = raw_train_ds.map(lambda x, y: x)
    vectorize_layer.adapt(train_text)

    # Prepare datasets
    train_ds = prepare_dataset(raw_train_ds, vectorize_layer)
    val_ds = prepare_dataset(raw_val_ds, vectorize_layer)

    # Build and compile model
    model = build_model(MAX_FEATURES, EMBEDDING_DIM)
    model.compile(
        loss=losses.BinaryCrossentropy(),
        optimizer='adam',
        metrics=[tf.metrics.BinaryAccuracy(threshold=0.5)]
    )

    model.summary()

    # Train model
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS
    )

    # Plot metrics
    plot_metrics(history)

    # Export model
    export_model = tf.keras.Sequential([
        vectorize_layer,
        model,
        layers.Activation('sigmoid')
    ])
    export_model.compile(
        loss=losses.BinaryCrossentropy(from_logits=False),
        optimizer='adam',
        metrics=['accuracy']
    )

    # Test model
    examples = tf.constant([
        "puppy ready for play",
        "WiedźminIV - jedna z najbardziej wyczekiwanych produkcji do lat. "
    ])
    print(export_model.predict(examples))
