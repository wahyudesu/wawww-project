interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
}

export function generateMathQuestions(count: number = 3): MathQuestion[] {
  const questions: MathQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const questionType = Math.floor(Math.random() * 4); // 0=add, 1=subtract, 2=multiply, 3=divide
    let question: MathQuestion;
    
    switch (questionType) {
      case 0: // Addition
        question = generateAddition();
        break;
      case 1: // Subtraction
        question = generateSubtraction();
        break;
      case 2: // Multiplication
        question = generateMultiplication();
        break;
      case 3: // Division
        question = generateDivision();
        break;
      default:
        question = generateAddition();
    }
    
    questions.push(question);
  }
  
  return questions;
}

function generateAddition(): MathQuestion {
  const a = Math.floor(Math.random() * 50) + 1;
  const b = Math.floor(Math.random() * 50) + 1;
  const answer = a + b;
  const options = generateOptions(answer);
  
  return {
    question: `${a} + ${b} = ?`,
    answer,
    options
  };
}

function generateSubtraction(): MathQuestion {
  const a = Math.floor(Math.random() * 50) + 20;
  const b = Math.floor(Math.random() * (a - 1)) + 1;
  const answer = a - b;
  const options = generateOptions(answer);
  
  return {
    question: `${a} - ${b} = ?`,
    answer,
    options
  };
}

function generateMultiplication(): MathQuestion {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  const answer = a * b;
  const options = generateOptions(answer);
  
  return {
    question: `${a} × ${b} = ?`,
    answer,
    options
  };
}

function generateDivision(): MathQuestion {
  const b = Math.floor(Math.random() * 10) + 2;
  const answer = Math.floor(Math.random() * 15) + 1;
  const a = b * answer;
  const options = generateOptions(answer);
  
  return {
    question: `${a} ÷ ${b} = ?`,
    answer,
    options
  };
}

function generateOptions(correctAnswer: number): number[] {
  const options = [correctAnswer];
  
  while (options.length < 4) {
    const wrongAnswer = correctAnswer + (Math.floor(Math.random() * 20) - 10);
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  return options;
}

export function formatMathQuiz(questions: MathQuestion[]): string {
  let quiz = "🧮 *Kuis Matematika*\n\n";
  
  questions.forEach((q, index) => {
    quiz += `${index + 1}. ${q.question}\n`;
    q.options.forEach((option, optIndex) => {
      const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
      quiz += `   ${letter}. ${option}\n`;
    });
    quiz += "\n";
  });
  
  quiz += "Balas dengan jawaban kamu (contoh: 1A 2B 3C)";
  return quiz;
}

export function checkMathAnswers(questions: MathQuestion[], userAnswers: string): { score: number; details: string } {
  const answers = userAnswers.toUpperCase().match(/\d+[A-D]/g) || [];
  let score = 0;
  let details = "📊 *Hasil Kuis:*\n\n";
  
  questions.forEach((q, index) => {
    const questionNum = index + 1;
    const userAnswer = answers.find(a => a.startsWith(questionNum.toString()));
    const correctOptionIndex = q.options.indexOf(q.answer);
    const correctLetter = String.fromCharCode(65 + correctOptionIndex);
    
    if (userAnswer) {
      const userLetter = userAnswer.slice(-1);
      const userSelectedIndex = userLetter.charCodeAt(0) - 65;
      const userValue = q.options[userSelectedIndex];
      
      if (userValue === q.answer) {
        score++;
        details += `${questionNum}. ${q.question} ✅\n   Jawaban: ${correctLetter}. ${q.answer}\n\n`;
      } else {
        details += `${questionNum}. ${q.question} ❌\n   Kamu: ${userLetter}. ${userValue}\n   Benar: ${correctLetter}. ${q.answer}\n\n`;
      }
    } else {
      details += `${questionNum}. ${q.question} ⏭️\n   Tidak dijawab\n   Benar: ${correctLetter}. ${q.answer}\n\n`;
    }
  });
  
  details += `Skor: ${score}/${questions.length} (${Math.round(score/questions.length*100)}%)`;
  
  return { score, details };
}
