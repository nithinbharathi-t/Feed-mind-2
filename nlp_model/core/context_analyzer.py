"""BERT-based context analyzer for understanding document content."""
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.cluster import KMeans
import nltk
from nltk.tokenize import sent_tokenize
import re

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

class ContextAnalyzer:
    """
    Analyzes document context using BERT embeddings.
    Extracts key topics, themes, and relevant context for question generation.
    """
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """Initialize the context analyzer with a BERT model."""
        self.model = SentenceTransformer(model_name)
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model.to(self.device)
    
    def analyze_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a document and extract meaningful context.
        
        Args:
            document: Document dict with 'text', 'metadata', 'sections'
            
        Returns:
            Dict with extracted context, topics, and key information
        """
        text = document.get('text', '')
        sections = document.get('sections', [])
        metadata = document.get('metadata', {})
        
        if not text.strip():
            return {
                'topics': [],
                'key_sentences': [],
                'entities': [],
                'question_contexts': [],
                'summary': ''
            }
        
        # Extract sentences
        sentences = sent_tokenize(text)
        if not sentences:
            sentences = [text]
        
        # Get embeddings for sentences
        embeddings = self.model.encode(sentences, convert_to_tensor=True)
        
        # Extract key sentences (most representative)
        key_sentences = self._extract_key_sentences(sentences, embeddings)
        
        # Extract topics
        topics = self._extract_topics(sentences, embeddings)
        
        # Extract entities (names, numbers, specific terms)
        entities = self._extract_entities(text)
        
        # Create question contexts (specific areas for questions)
        question_contexts = self._create_question_contexts(
            sentences, embeddings, topics, entities
        )
        
        # Generate summary
        summary = self._generate_summary(key_sentences)
        
        return {
            'topics': topics,
            'key_sentences': key_sentences,
            'entities': entities,
            'question_contexts': question_contexts,
            'summary': summary,
            'total_sentences': len(sentences),
            'metadata': metadata
        }
    
    def _extract_key_sentences(self, sentences: List[str], embeddings: torch.Tensor, top_k: int = 5) -> List[str]:
        """Extract the most important sentences using semantic centrality."""
        if len(sentences) <= top_k:
            return sentences
        
        # Calculate mean embedding (document centroid)
        mean_embedding = torch.mean(embeddings, dim=0)
        
        # Calculate similarity of each sentence to the centroid
        similarities = util.cos_sim(embeddings, mean_embedding.unsqueeze(0))
        
        # Get top-k most central sentences
        top_indices = torch.argsort(similarities.squeeze(), descending=True)[:top_k]
        key_sentences = [sentences[idx] for idx in top_indices.cpu().numpy()]
        
        return key_sentences
    
    def _extract_topics(self, sentences: List[str], embeddings: torch.Tensor, n_topics: int = 5) -> List[Dict[str, Any]]:
        """Extract topics using clustering on sentence embeddings."""
        if len(sentences) < 3:
            return [{'name': 'General', 'sentences': sentences, 'keywords': []}]
        
        # Determine number of clusters
        n_clusters = min(n_topics, len(sentences))
        
        # Cluster sentences
        embeddings_np = embeddings.cpu().numpy()
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings_np)
        
        # Group sentences by cluster
        topics = []
        for i in range(n_clusters):
            cluster_sentences = [sent for j, sent in enumerate(sentences) if cluster_labels[j] == i]
            if cluster_sentences:
                # Extract keywords from topic
                keywords = self._extract_keywords_from_sentences(cluster_sentences)
                
                topics.append({
                    'name': self._name_topic(keywords, cluster_sentences),
                    'sentences': cluster_sentences[:3],  # Top 3 sentences
                    'keywords': keywords[:5]
                })
        
        return topics
    
    def _extract_keywords_from_sentences(self, sentences: List[str]) -> List[str]:
        """Extract important keywords from sentences."""
        # Combine sentences
        text = ' '.join(sentences)
        
        # Extract words (alphanumeric only)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Count frequency
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        # Return top keywords
        return [word for word, freq in sorted_words[:10]]
    
    def _name_topic(self, keywords: List[str], sentences: List[str]) -> str:
        """Generate a name for a topic based on keywords."""
        if not keywords:
            return "General"
        
        # Use top 2-3 keywords to name the topic
        name = ' '.join(keywords[:2]).title()
        return name if name else "General"
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities like names, numbers, dates, etc."""
        entities = {
            'numbers': [],
            'dates': [],
            'emails': [],
            'phones': [],
            'capitalized': []
        }
        
        # Extract numbers
        numbers = re.findall(r'\b\d+(?:[.,]\d+)?\b', text)
        entities['numbers'] = list(set(numbers))[:10]
        
        # Extract dates (simple patterns)
        dates = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b', text)
        entities['dates'] = list(set(dates))[:10]
        
        # Extract emails
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        entities['emails'] = list(set(emails))[:10]
        
        # Extract phones
        phones = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)
        entities['phones'] = list(set(phones))[:10]
        
        # Extract capitalized words (potential names/places)
        capitalized = re.findall(r'\b[A-Z][a-z]+\b', text)
        entities['capitalized'] = list(set(capitalized))[:20]
        
        return entities
    
    def _create_question_contexts(
        self, 
        sentences: List[str], 
        embeddings: torch.Tensor,
        topics: List[Dict[str, Any]],
        entities: Dict[str, List[str]]
    ) -> List[Dict[str, Any]]:
        """
        Create specific contexts for question generation.
        Each context is a focused area that should generate 1-3 questions.
        """
        question_contexts = []
        
        # Create contexts from topics
        for topic in topics:
            context = {
                'type': 'topic',
                'focus': topic['name'],
                'content': ' '.join(topic['sentences']),
                'keywords': topic['keywords'],
                'suggested_question_types': self._suggest_question_types_for_topic(topic)
            }
            question_contexts.append(context)
        
        # Create contexts from entities
        if entities.get('numbers'):
            question_contexts.append({
                'type': 'numeric',
                'focus': 'Numeric Information',
                'content': f"Document contains numeric data: {', '.join(entities['numbers'][:5])}",
                'keywords': entities['numbers'][:5],
                'suggested_question_types': ['number', 'rating', 'select']
            })
        
        if entities.get('dates'):
            question_contexts.append({
                'type': 'temporal',
                'focus': 'Date Information',
                'content': f"Document contains date information: {', '.join(entities['dates'][:3])}",
                'keywords': entities['dates'][:3],
                'suggested_question_types': ['date', 'text']
            })
        
        if entities.get('emails') or entities.get('phones'):
            question_contexts.append({
                'type': 'contact',
                'focus': 'Contact Information',
                'content': 'Document contains contact information',
                'keywords': ['contact', 'information'],
                'suggested_question_types': ['email', 'tel', 'text']
            })
        
        return question_contexts
    
    def _suggest_question_types_for_topic(self, topic: Dict[str, Any]) -> List[str]:
        """Suggest appropriate question types based on topic content."""
        keywords = [kw.lower() for kw in topic.get('keywords', [])]
        content = topic.get('name', '').lower()
        
        types = []
        
        # Check for opinion/feedback keywords
        opinion_keywords = ['opinion', 'feedback', 'satisfaction', 'experience', 'feel', 'think', 'rate']
        if any(kw in content or kw in keywords for kw in opinion_keywords):
            types.extend(['rating', 'radio', 'textarea'])
        
        # Check for selection keywords
        selection_keywords = ['choose', 'select', 'option', 'preference', 'which']
        if any(kw in content or kw in keywords for kw in selection_keywords):
            types.extend(['radio', 'checkbox', 'select'])
        
        # Check for descriptive keywords
        descriptive_keywords = ['describe', 'explain', 'detail', 'comment', 'why', 'how']
        if any(kw in content or kw in keywords for kw in descriptive_keywords):
            types.extend(['textarea', 'text'])
        
        # Check for numeric keywords
        numeric_keywords = ['number', 'count', 'amount', 'quantity', 'age', 'years']
        if any(kw in content or kw in keywords for kw in numeric_keywords):
            types.extend(['number', 'text'])
        
        # Default types
        if not types:
            types = ['text', 'radio', 'textarea']
        
        return list(set(types))[:3]
    
    def find_similar_contexts(self, query: str, contexts: List[Dict[str, Any]], top_k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        """Find contexts most similar to a query."""
        if not contexts:
            return []
        
        # Encode query
        query_embedding = self.model.encode(query, convert_to_tensor=True)
        
        # Encode contexts
        context_texts = [ctx['content'] for ctx in contexts]
        context_embeddings = self.model.encode(context_texts, convert_to_tensor=True)
        
        # Calculate similarities
        similarities = util.cos_sim(query_embedding, context_embeddings)[0]
        
        # Get top-k
        top_indices = torch.argsort(similarities, descending=True)[:top_k]
        
        results = []
        for idx in top_indices:
            results.append((contexts[idx.item()], similarities[idx].item()))
        
        return results
