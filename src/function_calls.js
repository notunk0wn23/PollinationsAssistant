import { format } from 'date-fns';

class FunctionCall {
    constructor(name, description, func) {
        this.name = name || 'function';
        this.description = description || '';
        this.func = async (params) => {
            
        };
    }

    run(p) {
        this.func(p);
    }
}


export const math = new FunctionCall(
    'math',
    `This function allows you to invoke a basic Javascipt Eval function to perform math operations.
    You should use this whenever a question requires more than a simple answer, like with basic arithmetic.
    
    Needs one parameter; 'expression', which is the math expression to evaluate.`,
    async (params) => {
        return {result: eval(params.expression)};
    }
)

export const timedate = new FunctionCall(
    'timedate',
    `This function allows you to fetch the current time and/or date. ALWAYS invoke this whenver something requires the current date or time.

    One parameter; 'format' which is the format you would like it in, based on the format function from the Unicode Date Field Symbol Standard.`,
    async (params) => {
        return {result: format(Date.now(), params.format)};
    }
)