const mysql = require('mysql2/promise');

async function seed() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'quiz'
    });

    try {
        console.log("Clearing existing customized data...");
        // Clear previous mcqs and coding challenges to avoid duplicates
        await pool.query('DELETE FROM mcq_questions');
        await pool.query('DELETE FROM test_cases');
        await pool.query('DELETE FROM coding_challenges');
        
        // Define MCQ banks
        const mcqBank1to8 = [
            // Lab 1
            { t: 'Hello World', q: 'Which header file is required to use printf() in C?', c: '#include <stdio.h>', a: '#include <conio.h>', b: '#include <stdlib.h>', d: '#include <math.h>' },
            { t: 'Compiler Error', q: 'What error will occur if you forget a semicolon at the end of a statement?', c: 'Syntax Error', a: 'Logical Error', b: 'Runtime Error', d: 'Linker Error' },
            { t: 'Main Function', q: 'What is the correct signature for the main function in a standard C program?', c: 'int main()', a: 'void main()', b: 'main(void)', d: 'int Main()' },
            { t: 'Comments', q: 'How do you write a multi-line comment in C?', c: '/* comment */', a: '// comment //', b: '<!-- comment -->', d: '# comment #' },
            { t: 'Hello World', q: 'Which escape sequence is used for a new line?', c: '\\n', a: '\\t', b: '\\r', d: '\\a' },
            
            // Lab 2
            { t: 'Variables', q: 'Which of the following is a valid variable name in C?', c: '_myVar', a: '1myVar', b: 'my-Var', d: 'int' },
            { t: 'Constants', q: 'What is the difference between #define and const?', c: '#define is a preprocessor directive, const is a keyword', a: 'Both are same', b: '#define allocates memory', d: 'const cannot be used for integers' },
            { t: 'Operators', q: 'What is the result of 5 % 2?', c: '1', a: '2.5', b: '2', d: '0' },
            { t: 'Data Types', q: 'What is the size of an int in a 32-bit system typically?', c: '4 bytes', a: '2 bytes', b: '8 bytes', d: '1 byte' },
            { t: 'Constants', q: 'Which is correctly defining PI?', c: '#define PI 3.14', a: '#DEFINE PI 3.14', b: '#define PI = 3.14', d: 'define PI 3.14' },
            { t: 'Operators', q: 'Which operator is used for Logical AND?', c: '&&', a: '&', b: '||', d: 'AND' },
            
            // Lab 3
            { t: 'Algorithms', q: 'An algorithm is:', c: 'A step-by-step procedure to solve a problem', a: 'A computer program', b: 'A type of hardware', d: 'A C library' },
            { t: 'Flowcharts', q: 'Which shape represents a decision in a flowchart?', c: 'Diamond', a: 'Rectangle', b: 'Oval', d: 'Parallelogram' },
            { t: 'Pseudocode', q: 'Pseudocode is:', c: 'An informal high-level description of an algorithm', a: 'Machine code', b: 'A C compiler tool', d: 'A graphical diagram' },
            { t: 'Flowcharts', q: 'Which shape represents an input/output operation?', c: 'Parallelogram', a: 'Rectangle', b: 'Diamond', d: 'Oval' },
            
            // Lab 4
            { t: 'Precedence', q: 'Evaluate: 3 + 4 * 2', c: '11', a: '14', b: '24', d: '10' },
            { t: 'Division', q: 'What is the result of 5 / 2 in C?', c: '2', a: '2.5', b: '3', d: '2.0' },
            { t: 'Type Casting', q: 'How do you explicitly cast a float x to an int?', c: '(int)x', a: 'int(x)', b: '(integer)x', d: 'cast<int>(x)' },
            { t: 'Precedence', q: 'Which operator has the highest precedence?', c: '()', a: '*', b: '+', d: '=' },
            { t: 'Division', q: 'What is the result of 5.0 / 2?', c: '2.5', a: '2', b: '2.0', d: 'Error' },
            { t: 'Type Casting', q: 'What happens when a float is assigned to an int variable?', c: 'Fractional part is truncated', a: 'Value is rounded', b: 'Compiler error', d: 'Program crashes' },
            
            // Lab 5
            { t: 'Conditional', q: 'Which keyword is used to handle alternative cases in an if statement?', c: 'else', a: 'elif', b: 'otherwise', d: 'then' },
            { t: 'Switch', q: 'What keyword breaks out of a switch case?', c: 'break', a: 'stop', b: 'exit', d: 'return' },
            { t: 'Nested if', q: 'Can an if statement be placed inside another if statement?', c: 'Yes, always', a: 'No, never', b: 'Only in main()', d: 'Only if else is present' },
            { t: 'Conditional', q: 'Evaluate: (5 > 3) && (2 < 4)', c: '1 (True)', a: '0 (False)', b: 'Syntax Error', d: 'Undefined' },
            { t: 'Switch', q: 'Which type of value cannot be evaluated in a switch case?', c: 'float', a: 'int', b: 'char', d: 'enum' },
            { t: 'Conditional', q: 'Which of the following is the ternary operator?', c: '?:', a: '??', b: '::', d: '->' },
            
            // Lab 6
            { t: 'Loops', q: 'Which loop is guaranteed to execute at least once?', c: 'do-while', a: 'while', b: 'for', d: 'nested' },
            { t: 'For Loop', q: 'What are the three parts of a for loop declaration?', c: 'Initialization, Condition, Increment/Decrement', a: 'Start, Stop, Step', b: 'Condition, Execution, Update', d: 'Initialize, Execute, Break' },
            { t: 'While Loop', q: 'What happens if the condition in a while loop is initially false?', c: 'The loop body does not execute', a: 'It executes once', b: 'Compiler error', d: 'Infinite loop' },
            { t: 'Loops', q: 'Which loop is best when the number of iterations is known?', c: 'for', a: 'while', b: 'do-while', d: 'if' },
            { t: 'Loops', q: 'What is an infinite loop?', c: 'A loop that never terminates', a: 'A loop with a break statement', b: 'A loop inside a loop', d: 'A loop with no condition' },
            
            // Lab 7
            { t: 'Nested Loops', q: 'How many times will the inner loop execute if outer runs 3 times and inner runs 4 times?', c: '12', a: '7', b: '3', d: '4' },
            { t: 'Break', q: 'What does the break statement do inside a loop?', c: 'Terminates the loop immediately', a: 'Skips the current iteration', b: 'Restarts the loop', d: 'Pauses the loop' },
            { t: 'Continue', q: 'What does the continue statement do?', c: 'Skips the rest of the current iteration', a: 'Exits the loop', b: 'Restarts the program', d: 'Goes to a label' },
            { t: 'Goto', q: 'Why is the goto statement generally discouraged in C?', c: 'It makes code difficult to read and maintain', a: 'It is slow', b: 'It causes syntax errors', d: 'It crashes the compiler' },
            { t: 'Nested Loops', q: 'Which loop is evaluated first in a nested loop setup?', c: 'Outer loop starts, then inner loop runs to completion', a: 'Inner loop starts first', b: 'Both run simultaneously', d: 'Depends on the compiler' },
            
            // Lab 8
            { t: 'Arrays', q: 'What is the index of the first element in a C array?', c: '0', a: '1', b: '-1', d: 'Depends' },
            { t: 'Strings', q: 'Which character terminates a C string?', c: "'\\0'", a: "'\\n'", b: "'EOF'", d: "'\\r'" },
            { t: 'String Functions', q: 'Which function finds the length of a string?', c: 'strlen()', a: 'strlength()', b: 'length()', d: 'len()' },
            { t: 'Arrays', q: 'How do you declare an integer array of size 10?', c: 'int arr[10];', a: 'array int[10];', b: 'int arr(10);', d: 'int[10] arr;' },
            { t: 'String Functions', q: 'Which function compares two strings?', c: 'strcmp()', a: 'strcompare()', b: 'compare()', d: 'cmp()' },
            { t: 'Two-Dimensional Array', q: 'How to access the element in 2nd row and 3rd column? (0-indexed)', c: 'arr[1][2]', a: 'arr[2][3]', b: 'arr[1,2]', d: 'arr[2,3]' },
            { t: 'String Functions', q: 'Which function copies a string?', c: 'strcpy()', a: 'strcopy()', b: 'copy()', d: 'cpy()' },
            { t: 'Arrays', q: 'What happens if you access an array out of bounds?', c: 'Undefined behavior', a: 'Compiler error', b: 'Returns 0', d: 'Program safely exits' },
            { t: 'Strings', q: 'What is a string in C?', c: 'An array of characters ending with \\0', a: 'A primitive data type', b: 'An object', d: 'A pointer to int' },
            
            // Extra Lab 1-8 pool...
            { t: 'General', q: 'What is the output of printf("%d", 10 + 5);?', c: '15', a: '105', b: '10 + 5', d: 'Error' },
            { t: 'General', q: 'Which format specifier is used for a single character?', c: '%c', a: '%s', b: '%char', d: '%d' },
            { t: 'General', q: 'What does %d stand for in printf?', c: 'Decimal integer', a: 'Double', b: 'Data', d: 'Digit character' },
            { t: 'General', q: 'Which header contains string manipulation functions?', c: '<string.h>', a: '<strings.h>', b: '<str.h>', d: '<stdlib.h>' },
            { t: 'General', q: 'How do you initialize an array during declaration?', c: 'int arr[] = {1, 2, 3};', a: 'int arr[] = [1, 2, 3];', b: 'int arr() = {1, 2, 3};', d: 'int arr{3} = 1, 2, 3;' },
            { t: 'General', q: 'What is the purpose of the return 0; statement in main?', c: 'Indicates successful execution', a: 'Returns the value 0 to the user', b: 'Terminates the program forcefully', d: 'Restarts the program' },
            { t: 'General', q: 'Which operator is used to get the memory address of a variable?', c: '&', a: '*', b: '->', d: '@' },
            { t: 'General', q: 'What is the correct syntax for an if statement?', c: 'if (condition) {}', a: 'if condition then {}', b: 'if condition {}', d: 'if [condition] {}' },
            { t: 'General', q: 'Which of the following is an assignment operator?', c: '=', a: '==', b: '!=', d: '===' },
            { t: 'General', q: 'What is the output of 10 % 3?', c: '1', a: '3', b: '3.33', d: '0' },
            { t: 'General', q: 'Which function is used to read formatted input from the user?', c: 'scanf()', a: 'read()', b: 'input()', d: 'get()' },
            { t: 'General', q: 'What does ++x do?', c: 'Increments x before its value is used', a: 'Increments x after its value is used', b: 'Adds 2 to x', d: 'Syntax error' },
            { t: 'General', q: 'Can an array hold mixed data types in C?', c: 'No', a: 'Yes', b: 'Only if declared as dynamic', d: 'Only strings and chars' },
            { t: 'General', q: 'What is the size of a char in C?', c: '1 byte', a: '2 bytes', b: '4 bytes', d: 'Depends on system' },
            { t: 'General', q: 'Which statement is true about while and do-while?', c: 'do-while checks condition at the end', a: 'while checks condition at the end', b: 'They are exactly the same', d: 'do-while is faster' },
            { t: 'General', q: 'What is the output of 5 == 5 ? 1 : 0;', c: '1', a: '0', b: '5', d: 'Error' },
            { t: 'General', q: 'How do you access the value at index 2 of an array named arr?', c: 'arr[2]', a: 'arr(2)', b: 'arr<2>', d: 'arr.2' },
            { t: 'General', q: 'Which loop is typically used to iterate over arrays?', c: 'for loop', a: 'while loop', b: 'do-while loop', d: 'infinite loop' },
            { t: 'General', q: 'What is the correct way to declare a 2D array?', c: 'int arr[3][4];', a: 'int arr[3,4];', b: 'int arr(3)(4);', d: 'int arr[3 * 4];' }
        ];

        const mcqBank9 = [
            // Lab 9
            { t: 'Functions', q: 'What is a user-defined function in C?', c: 'A block of code defined by the programmer to perform a specific task', a: 'A built-in library function', b: 'A system call', d: 'A macro' },
            { t: 'Parameters', q: 'What is the purpose of function parameters?', c: 'To pass data into the function', a: 'To return data from the function', b: 'To declare local variables', d: 'To name the function' },
            { t: 'Return Values', q: 'What keyword is used to send a value back from a function?', c: 'return', a: 'send', b: 'yield', d: 'output' },
            { t: 'Math Library', q: 'Which header file is required for sqrt() and pow()?', c: '<math.h>', a: '<stdlib.h>', b: '<stdio.h>', d: '<ctype.h>' },
            { t: 'Functions', q: 'If a function does not return a value, its return type should be:', c: 'void', a: 'int', b: 'null', d: 'empty' },
            { t: 'Math Library', q: 'What does pow(2, 3) return?', c: '8', a: '6', b: '5', d: '9' },
            { t: 'Functions', q: 'What is a function declaration (prototype)?', c: 'Tells compiler about function name, return type, and parameters', a: 'The actual code of the function', b: 'Calling the function', d: 'Including a header file' },
            { t: 'Scope', q: 'Variables declared inside a function are called:', c: 'Local variables', a: 'Global variables', b: 'Static variables', d: 'External variables' },
            { t: 'Math Library', q: 'What does sqrt(16) return?', c: '4', a: '8', b: '256', d: '2' },
            { t: 'Functions', q: 'Can a function call itself in C?', c: 'Yes (Recursion)', a: 'No', b: 'Only void functions', d: 'Only main function' },
            { t: 'Parameters', q: 'What is passing by value?', c: 'Passing a copy of the variable', a: 'Passing the memory address', b: 'Passing a pointer', d: 'Passing an array' }
        ];

        // Shuffle helper
        function shuffle(arr) {
            return [...arr].sort(() => Math.random() - 0.5);
        }

        // Generate MCQs for each version
        const versions = [
            { code: 'V007', isLab9: false },
            { code: 'V016', isLab9: false },
            { code: 'V020', isLab9: true },
            { code: 'V023', isLab9: true },
            { code: 'V_TEST', isLab9: false }
        ];

        let mcqInsertCount = 0;
        for (const v of versions) {
            let poolBank = shuffle(mcqBank1to8);
            if (v.isLab9) {
                poolBank = shuffle([...mcqBank1to8, ...mcqBank9]);
            }
            
            const selected = poolBank.slice(0, 30);
            let qNum = 1;
            for (const q of selected) {
                // Randomize options
                const opts = [{t: q.c, isCorrect: true}, {t: q.a, isCorrect: false}, {t: q.b, isCorrect: false}, {t: q.d, isCorrect: false}];
                const shuffledOpts = shuffle(opts);
                let correctIdx = 0;
                shuffledOpts.forEach((o, idx) => { if(o.isCorrect) correctIdx = idx; });
                
                await pool.query(
                    'INSERT INTO mcq_questions (version_code, q_number, topic, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [v.code, qNum, q.t, q.q, shuffledOpts[0].t, shuffledOpts[1].t, shuffledOpts[2].t, shuffledOpts[3].t, correctIdx]
                );
                qNum++;
                mcqInsertCount++;
            }
        }
        console.log(`Inserted ${mcqInsertCount} MCQs successfully.`);

        // Update total_questions in quiz_versions
        await pool.query('UPDATE quiz_versions SET total_questions = 30');

        // Coding Challenges
        const codingPool1to8 = [
            { c: 'C01', t: 'Triangle Pattern', d: 'Print a right-aligned triangle pattern of stars with N rows.', con: '1 <= N <= 10', in: '3', out: '  *\n **\n***' },
            { c: 'C02', t: 'Prime Check', d: 'Check if a number N is prime. Print "Prime" or "Not Prime".', con: '1 <= N <= 100', in: '7', out: 'Prime' },
            { c: 'C03', t: 'Reverse Digits', d: 'Reverse the digits of a given integer N.', con: '10 <= N <= 9999', in: '1234', out: '4321' },
            { c: 'C04', t: 'Sum of Array', d: 'Find the sum of all elements in an array. First line is N (size), next line is N space-separated integers.', con: '1 <= N <= 50', in: '3\n1 2 3', out: '6' },
            { c: 'C05', t: 'Vowel Counter', d: 'Count the number of vowels in a string (all lowercase).', con: 'String length <= 100', in: 'hello', out: '2' },
            { c: 'C06', t: 'Circle Area', d: 'Calculate area of a circle with radius R. Use PI=3.14. Print 2 decimal places.', con: '1 <= R <= 100', in: '5', out: '78.50' },
            { c: 'C07', t: 'Even/Odd Sums', d: 'Calculate the sum of all even and odd numbers from 1 to N separately. Print "Even: X, Odd: Y".', con: '1 <= N <= 100', in: '4', out: 'Even: 6, Odd: 4' },
            { c: 'C08', t: 'Multiplication Table', d: 'Print the multiplication table of N up to 5.', con: '1 <= N <= 10', in: '2', out: '2\n4\n6\n8\n10' },
            { c: 'C09', t: 'String Compare', d: 'Read two strings and print "Same" if they are identical, else "Different".', con: 'No spaces', in: 'test\ntest', out: 'Same' },
            { c: 'C10', t: 'Max in Array', d: 'Find the maximum number in an array of N integers.', con: '1 <= N <= 50', in: '4\n1 5 3 2', out: '5' }
        ];

        const codingPool9 = [
            { c: 'C11', t: 'Power Function', d: 'Read base and exponent, print base^exponent using pow().', con: '1 <= base, exp <= 5', in: '2 3', out: '8' },
            { c: 'C12', t: 'Palindrome Check', d: 'Write a function to check if a number is a palindrome. Print "Yes" or "No".', con: '10 <= N <= 99999', in: '121', out: 'Yes' },
            { c: 'C13', t: 'Max of Three', d: 'Write a function that returns the maximum of 3 integers.', con: '-100 <= N <= 100', in: '4 9 2', out: '9' },
            { c: 'C14', t: 'Square and Cube', d: 'Write functions to calculate square and cube. Print "Sq: X, Cu: Y".', con: '1 <= N <= 10', in: '3', out: 'Sq: 9, Cu: 27' },
            { c: 'C15', t: 'Square Root', d: 'Calculate the square root of N using sqrt(). Print 2 decimal places.', con: '1 <= N <= 100', in: '16', out: '4.00' }
        ];

        // Assign 5 coding challenges per version
        let codeInsertCount = 0;
        let testCaseCount = 0;

        for (const v of versions) {
            let poolCode = shuffle(codingPool1to8);
            if (v.isLab9) {
                poolCode = shuffle([...codingPool1to8, ...codingPool9]);
            }
            
            const selected = poolCode.slice(0, 5);
            let idx = 1;
            for (const c of selected) {
                const uniqueCode = `${v.code}_P${idx}`; // V007_P1, etc.
                
                await pool.query(
                    'INSERT INTO coding_challenges (version_code, challenge_code, title, description, constraints_txt, sample_input, sample_output) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [v.code, uniqueCode, c.t, c.d, c.con, c.in, c.out]
                );
                codeInsertCount++;

                // Generate basic test cases
                await pool.query('INSERT INTO test_cases (challenge_code, stdin_input, expected_output, case_number) VALUES (?, ?, ?, ?)', [uniqueCode, c.in, c.out, 1]);
                testCaseCount++;
                
                // Add a hidden test case (simplistic variation)
                let hiddenIn = c.in;
                let hiddenOut = c.out;
                
                if (c.t === 'Prime Check') { hiddenIn = '10'; hiddenOut = 'Not Prime'; }
                if (c.t === 'Max in Array') { hiddenIn = '3\\n10 20 5'; hiddenOut = '20'; }
                if (c.t === 'Power Function') { hiddenIn = '3 2'; hiddenOut = '9'; }
                if (c.t === 'Palindrome Check') { hiddenIn = '123'; hiddenOut = 'No'; }
                
                // Only insert if modified
                if (hiddenIn !== c.in) {
                    await pool.query('INSERT INTO test_cases (challenge_code, stdin_input, expected_output, case_number) VALUES (?, ?, ?, ?)', [uniqueCode, hiddenIn, hiddenOut, 2]);
                    testCaseCount++;
                }

                idx++;
            }
        }
        
        console.log(`Inserted ${codeInsertCount} Coding Challenges successfully.`);
        console.log(`Inserted ${testCaseCount} Test Cases successfully.`);
        
    } catch (e) {
        console.error("Error during seeding:", e);
    } finally {
        pool.end();
    }
}

seed();
