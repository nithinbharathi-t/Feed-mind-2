"""BERT-based question generator that creates context-specific questions."""
import torch
from transformers import BartForConditionalGeneration, BartTokenizer
from typing import List, Dict, Any, Optional
import random
import re
from .context_analyzer import ContextAnalyzer

class QuestionGenerator:
    """
    Generates context-specific questions using BERT analysis and BART generation.
    Creates relevant options and placeholders based on document content.
    """
    
    def __init__(
        self,
        model_name: str = "facebook/bart-large-cnn",
        use_pretrained: bool = True
    ):
        """Initialize the question generator."""
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.context_analyzer = ContextAnalyzer()
        
        # Load generation model
        if use_pretrained:
            self.tokenizer = BartTokenizer.from_pretrained(model_name)
            self.model = BartForConditionalGeneration.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
        else:
            self.tokenizer = None
            self.model = None
    
    def generate_questions(
        self,
        prompt: str,
        num_questions: int = 5,
        uploaded_documents: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate questions based on prompt and uploaded documents.
        
        Args:
            prompt: User's prompt for question generation
            num_questions: Number of questions to generate
            uploaded_documents: List of analyzed documents with context
            
        Returns:
            List of question objects with type, text, options, etc.
        """
        questions = []
        
        if not uploaded_documents:
            # Generate template questions if no documents
            return self._generate_template_questions(prompt, num_questions)
        
        # Analyze all documents
        all_contexts = []
        for doc in uploaded_documents:
            analysis = self.context_analyzer.analyze_document(doc)
            all_contexts.extend(analysis.get('question_contexts', []))
        
        if not all_contexts:
            return self._generate_template_questions(prompt, num_questions)
        
        # Find relevant contexts for the prompt
        relevant_contexts = self.context_analyzer.find_similar_contexts(
            prompt, all_contexts, top_k=min(num_questions * 2, len(all_contexts))
        )
        
        # Generate questions from each relevant context
        for context, similarity in relevant_contexts[:num_questions]:
            if similarity < 0.3:  # Skip low-relevance contexts
                continue
            
            question = self._generate_question_from_context(context, prompt)
            if question:
                questions.append(question)
        
        # Fill remaining with template questions if needed
        while len(questions) < num_questions:
            template_q = self._generate_single_template_question(prompt, len(questions))
            questions.append(template_q)
        
        return questions[:num_questions]
    
    def _generate_question_from_context(
        self,
        context: Dict[str, Any],
        prompt: str
    ) -> Optional[Dict[str, Any]]:
        """Generate a specific question from a context."""
        focus = context.get('focus', 'General')
        content = context.get('content', '')
        keywords = context.get('keywords', [])
        suggested_types = context.get('suggested_question_types', ['text'])
        
        # Choose question type
        question_type = random.choice(suggested_types)
        
        # Generate question text based on context
        question_text = self._create_question_text(focus, content, keywords, prompt, question_type)
        
        # Generate question object
        question = {
            'id': f'q_{random.randint(1000, 9999)}',
            'text': question_text,
            'type': question_type,
            'required': False
        }
        
        # Add type-specific fields
        if question_type in ['radio', 'checkbox', 'select']:
            question['options'] = self._generate_options_from_context(context, question_text)
        elif question_type in ['text', 'email', 'tel', 'number']:
            question['placeholder'] = self._generate_placeholder_from_context(context, question_type)
        elif question_type == 'rating':
            question['min'] = 1
            question['max'] = 5
            question['minLabel'] = 'Poor'
            question['maxLabel'] = 'Excellent'
        elif question_type == 'textarea':
            question['placeholder'] = f'Please provide details about {focus.lower()}'
        
        return question
    
    def _create_question_text(
        self,
        focus: str,
        content: str,
        keywords: List[str],
        prompt: str,
        question_type: str
    ) -> str:
        """Create question text using context information."""
        # Extract key phrases from content
        sentences = content.split('.')
        key_phrase = sentences[0].strip() if sentences else focus
        
        # Question templates based on type
        templates = {
            'text': [
                f"What is your {focus.lower()}?",
                f"Please provide information about {focus.lower()}",
                f"What {focus.lower()} would you like to share?",
                f"Can you describe your {focus.lower()}?",
            ],
            'textarea': [
                f"Please describe your experience with {focus.lower()}",
                f"What are your thoughts on {focus.lower()}?",
                f"Can you provide detailed feedback about {focus.lower()}?",
                f"Please share your comments regarding {focus.lower()}",
            ],
            'radio': [
                f"How would you rate {focus.lower()}?",
                f"What is your opinion on {focus.lower()}?",
                f"Which option best describes your view on {focus.lower()}?",
            ],
            'checkbox': [
                f"Which of the following apply to {focus.lower()}? (Select all that apply)",
                f"What aspects of {focus.lower()} are relevant to you?",
                f"Please select all that relate to {focus.lower()}",
            ],
            'select': [
                f"Please choose your preference for {focus.lower()}",
                f"Select the option that best fits {focus.lower()}",
            ],
            'rating': [
                f"How would you rate {focus.lower()}?",
                f"Please rate your satisfaction with {focus.lower()}",
                f"On a scale, how do you evaluate {focus.lower()}?",
            ],
            'number': [
                f"Please enter the number for {focus.lower()}",
                f"What is the quantity of {focus.lower()}?",
            ],
            'email': [
                f"What is your email address?",
                f"Please provide your email for {focus.lower()}",
            ],
            'tel': [
                f"What is your phone number?",
                f"Please provide your contact number",
            ],
            'date': [
                f"What is the date for {focus.lower()}?",
                f"Please select the date related to {focus.lower()}",
            ]
        }
        
        # Use keywords to make question more specific
        if keywords and len(keywords) > 0:
            keywords_str = ', '.join(keywords[:3])
            if question_type in ['radio', 'checkbox', 'select']:
                return f"Regarding {keywords_str}, {templates[question_type][0].lower()}"
        
        # Select random template
        return random.choice(templates.get(question_type, templates['text']))
    
    def _generate_options_from_context(
        self,
        context: Dict[str, Any],
        question_text: str
    ) -> List[str]:
        """Generate relevant options based on context."""
        keywords = context.get('keywords', [])
        content_type = context.get('type', 'general')
        
        # If we have good keywords, use them
        if keywords and len(keywords) >= 3:
            options = [kw.title() for kw in keywords[:5]]
            options.append('Other')
            return options
        
        # Generate options based on context type
        if 'satisfaction' in question_text.lower() or 'rate' in question_text.lower():
            return ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
        elif 'agree' in question_text.lower():
            return ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree']
        elif 'frequency' in question_text.lower() or 'often' in question_text.lower():
            return ['Always', 'Often', 'Sometimes', 'Rarely', 'Never']
        elif 'quality' in question_text.lower():
            return ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']
        elif content_type == 'numeric':
            return ['0-10', '11-20', '21-30', '31-40', '40+']
        else:
            # Generate generic but relevant options from focus
            focus = context.get('focus', 'Item')
            return [
                f'{focus} Option 1',
                f'{focus} Option 2',
                f'{focus} Option 3',
                f'{focus} Option 4',
                'Other'
            ]
    
    def _generate_placeholder_from_context(
        self,
        context: Dict[str, Any],
        question_type: str
    ) -> str:
        """Generate relevant placeholder text based on context."""
        focus = context.get('focus', 'information').lower()
        
        placeholders = {
            'text': f'Enter your {focus}',
            'email': 'your.email@example.com',
            'tel': '(123) 456-7890',
            'number': f'Enter number for {focus}',
            'textarea': f'Provide details about {focus}'
        }
        
        return placeholders.get(question_type, f'Enter {focus}')
    
    def _generate_template_questions(
        self,
        prompt: str,
        num_questions: int
    ) -> List[Dict[str, Any]]:
        """Generate context-aware template questions based on prompt analysis."""
        prompt_lower = prompt.lower()
        
        # Detect survey type from prompt
        survey_type = self._detect_survey_type(prompt_lower)
        
        # Get appropriate template questions for the survey type
        template_pool = self._get_templates_for_survey_type(survey_type, prompt)
        
        # Select questions
        questions = []
        for i in range(min(num_questions, len(template_pool))):
            question = {
                'id': f'q_{random.randint(1000, 9999)}',
                'required': False,
                **template_pool[i]
            }
            questions.append(question)
        
        return questions
    
    def _detect_survey_type(self, prompt_lower: str) -> str:
        """Detect the type of survey from the prompt."""
        # Check for specific business types
        if any(word in prompt_lower for word in ['coffee shop', 'cafe', 'coffee house', 'coffeehouse', 'barista']):
            return 'coffee_shop'
        elif any(word in prompt_lower for word in ['restaurant', 'dining', 'food service', 'eatery', 'bistro']):
            return 'restaurant'
        elif any(word in prompt_lower for word in ['hotel', 'accommodation', 'resort', 'lodging', 'stay']):
            return 'hotel'
        elif any(word in prompt_lower for word in ['retail', 'store', 'shop', 'shopping', 'purchase']):
            return 'retail'
        elif any(word in prompt_lower for word in ['product', 'item', 'merchandise']):
            return 'product'
        elif any(word in prompt_lower for word in ['service', 'support', 'helpdesk', 'assistance']):
            return 'service'
        elif any(word in prompt_lower for word in ['employee', 'staff', 'workplace', 'work environment', 'job']):
            return 'employee'
        elif any(word in prompt_lower for word in ['customer', 'client', 'patron']):
            return 'customer'
        elif any(word in prompt_lower for word in ['event', 'conference', 'seminar', 'workshop']):
            return 'event'
        elif any(word in prompt_lower for word in ['delivery', 'shipping', 'courier']):
            return 'delivery'
        else:
            return 'general'
    
    def _get_templates_for_survey_type(self, survey_type: str, prompt: str) -> List[Dict[str, Any]]:
        """Get specific question templates based on survey type."""
        
        templates = {
            'coffee_shop': [
                {
                    'text': 'How would you rate the quality of your beverage?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'How satisfied were you with the service speed?',
                    'type': 'radio',
                    'options': ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                },
                {
                    'text': 'Please rate the ambiance and atmosphere',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'Which aspects did you enjoy most?',
                    'type': 'checkbox',
                    'options': ['Coffee Quality', 'Food Selection', 'Atmosphere', 'Staff Friendliness', 'Cleanliness', 'Location']
                },
                {
                    'text': 'How likely are you to recommend us to friends?',
                    'type': 'radio',
                    'options': ['Extremely Likely', 'Very Likely', 'Somewhat Likely', 'Not Likely', 'Not at all Likely']
                },
                {
                    'text': 'Any additional comments or suggestions?',
                    'type': 'textarea',
                    'placeholder': 'Share your thoughts about your experience...'
                },
                {
                    'text': 'Email (optional for follow-up)',
                    'type': 'email',
                    'placeholder': 'your@email.com'
                }
            ],
            'restaurant': [
                {
                    'text': 'How would you rate the food quality?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'How satisfied were you with the service?',
                    'type': 'radio',
                    'options': ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                },
                {
                    'text': 'Please rate the value for money',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'What did you order?',
                    'type': 'text',
                    'placeholder': 'Please specify your meal'
                },
                {
                    'text': 'How likely are you to return?',
                    'type': 'radio',
                    'options': ['Definitely', 'Probably', 'Maybe', 'Probably Not', 'Definitely Not']
                },
                {
                    'text': 'Any suggestions for improvement?',
                    'type': 'textarea',
                    'placeholder': 'Share your feedback...'
                }
            ],
            'retail': [
                {
                    'text': 'How easy was it to find what you were looking for?',
                    'type': 'radio',
                    'options': ['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult']
                },
                {
                    'text': 'How would you rate our product selection?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'How satisfied were you with staff assistance?',
                    'type': 'radio',
                    'options': ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                },
                {
                    'text': 'How would you rate your checkout experience?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'Would you recommend our store to others?',
                    'type': 'radio',
                    'options': ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not']
                },
                {
                    'text': 'Additional feedback',
                    'type': 'textarea',
                    'placeholder': 'Tell us more about your shopping experience...'
                }
            ],
            'service': [
                {
                    'text': 'How would you rate your overall experience?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'How responsive was our team?',
                    'type': 'radio',
                    'options': ['Very Responsive', 'Responsive', 'Neutral', 'Slow', 'Very Slow']
                },
                {
                    'text': 'Did we resolve your issue?',
                    'type': 'radio',
                    'options': ['Fully Resolved', 'Mostly Resolved', 'Partially Resolved', 'Not Resolved']
                },
                {
                    'text': 'How knowledgeable was our staff?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Not Knowledgeable',
                    'maxLabel': 'Very Knowledgeable'
                },
                {
                    'text': 'How can we improve our service?',
                    'type': 'textarea',
                    'placeholder': 'Your suggestions are valuable to us...'
                },
                {
                    'text': 'Contact email (optional)',
                    'type': 'email',
                    'placeholder': 'your@email.com'
                }
            ],
            'employee': [
                {
                    'text': 'How satisfied are you with your work environment?',
                    'type': 'radio',
                    'options': ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                },
                {
                    'text': 'How would you rate communication within the team?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'Do you feel valued at work?',
                    'type': 'radio',
                    'options': ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree']
                },
                {
                    'text': 'What aspects of work are most important to you?',
                    'type': 'checkbox',
                    'options': ['Work-Life Balance', 'Career Growth', 'Compensation', 'Team Culture', 'Management Support']
                },
                {
                    'text': 'Any suggestions for workplace improvement?',
                    'type': 'textarea',
                    'placeholder': 'Share your thoughts...'
                }
            ],
            'general': [
                {
                    'text': 'How would you rate your overall experience?',
                    'type': 'rating',
                    'min': 1,
                    'max': 5,
                    'minLabel': 'Poor',
                    'maxLabel': 'Excellent'
                },
                {
                    'text': 'How satisfied are you?',
                    'type': 'radio',
                    'options': ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                },
                {
                    'text': 'What did you like most?',
                    'type': 'textarea',
                    'placeholder': 'Share your thoughts...'
                },
                {
                    'text': 'What could be improved?',
                    'type': 'textarea',
                    'placeholder': 'Your feedback helps us improve...'
                },
                {
                    'text': 'Would you recommend this to others?',
                    'type': 'radio',
                    'options': ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not']
                },
                {
                    'text': 'Email (optional)',
                    'type': 'email',
                    'placeholder': 'your@email.com'
                }
            ]
        }
        
        return templates.get(survey_type, templates['general'])
    
    def load_custom_model(self, model_path: str):
        """Load a custom fine-tuned model."""
        try:
            self.tokenizer = BartTokenizer.from_pretrained(model_path)
            self.model = BartForConditionalGeneration.from_pretrained(model_path)
            self.model.to(self.device)
            self.model.eval()
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
