import { any, string, number, boolean, readonly, array, object, nullable, isType } from '../src/types';

describe('type', function () {
  function all(arr) {
    return arr.reduce((a, b) => a && b, true);
  }


  it('knows what types are', function () {
    expect([
      number,
      string,
      {},
      1,
      null
    ].map(isType)).toEqual([
      true,
      true,
      false,
      false,
      false
    ]);
  });


  it('has names', function () {
    expect([
      any, string, number, boolean,
      array(number), nullable(object({ x: number, y: number }))
    ].map(t => t.name)).toEqual([
      'any', 'string', 'number', 'boolean',
      'array<number>', 'nullable<{ x: number, y: number }>'
    ]);
  });


  it('defines basic types: string, number & boolean', function () {
    expect(all([
      any.valid(''),
      any.valid(true),
      any.valid(false),
      any.valid(6),

      string.valid(''),
      !string.valid(true),
      !string.valid(false),
      !string.valid(6),

      !boolean.valid(''),
      boolean.valid(true),
      boolean.valid(false),
      !boolean.valid(6),

      !number.valid(''),
      !number.valid(true),
      !number.valid(false),
      number.valid(6)
    ])).toBeTruthy();

    expect([
      string,
      boolean,
      number
    ].map(x => x.defaultValue())).toEqual(['', false, 0]);
  });

  it('can make a type readonly', function () {
    expect(all([number, string, boolean].map(type => {
      const newType = readonly(type);

      return !newType.writable && newType.defaultValue === type.defaultValue;
    }))).toBeTruthy();
  });

  it('can override defaultValues', function () {
    expect([
      string.default('cute cats'),
      boolean.default(true),
      number.default(10)
    ].map(x => x.defaultValue())).toEqual(['cute cats', true, 10]);
  });


  it('throws exceptions if given invalid defaults', function () {
    expect(() => number.default('yo')).toThrow();
    expect(() => object({ x: number }).default(null)).toThrow();
  });


  it('can marshal and unmarshal types', function () {
    // since any type can marshal into promises, any compositioning type must return a promise
    expect(array(number).marshal([])).toEqual(jasmine.any(Promise));

    const color = Object.create(object({
      r: number,
      g: number,
      b: number,
      a: number
    }));

    color.name = 'color';

    color.unmarshal = str => {
      if (typeof str === 'string') {
        if (str.length < 7) return str;

        return {
          r: parseInt(str.slice(1,3), 16)/255,
          g: parseInt(str.slice(3,5), 16)/255,
          b: parseInt(str.slice(5,7), 16)/255,
          a: parseInt(str.slice(7) || 'ff', 16)/255
        }
      }

      return str;
    };

    expect(color.unmarshal('#ff0000')).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: 1
    });

    expect(color.valid(color.unmarshal('#00ff00'))).toBeTruthy();
  });

  describe('can create composite types:', function () {

    const person = object({
      name: string,
      age: number,
      fullname: object({
        first: string,
        last: string
      })
    });

    function isFunctionThrowException(func, type) {
      try {
        func(type);
      } catch (e) {
        return e instanceof TypeError &&
            (e.message === 'Invalid base type.' ||
             e.message === 'Not all object properties were types.');
      }
      return false;
    }

    it('object', function () {
      const default1 = person.defaultValue(),
        default2 = person.defaultValue();

      // The properties assume their respective defaults.
      expect(default1).toEqual({ name: '', age: 0, fullname: { first: '', last: '' } });

      // The instances returned by `defaultValue` are not the same.
      expect(default1 === default2).toBeFalsy();

      // Needs all properties to be valid.
      expect(person.valid({ name: 'yo' })).toBeFalsy();

      // Properties must have correct type.
      expect(person.valid({ name: 'yo', age: '15' })).toBeFalsy();

      // Anything else should fail.
      expect(person.valid('123')).toBeFalsy();
      expect(person.valid(123)).toBeFalsy();
      expect(person.valid(true)).toBeFalsy();
      expect(person.valid(null)).toBeFalsy();
    });

    it('"nullable" function should throw TypeError for invalid base type as parameter', function () {
      expect([
        null,
        undefined,
        function () {},
        {}
      ].every(x => isFunctionThrowException(nullable, x))).toBeTruthy();
    });

    it('"readonly" function should throw TypeError for invalid base type as parameter', function () {
      expect([
        null,
        undefined,
        function () {},
        {}
      ].every(x => isFunctionThrowException(readonly, x))).toBeTruthy();
    });

    it('"array" function should throw TypeError for invalid base type as parameter', function () {
      expect([
        null,
        undefined,
        function () {},
        {}
      ].every(x => isFunctionThrowException(array, x))).toBeTruthy();
    });

    it('"object" function should throw TypeError for invalid property structure as parameter', function () {
      expect([
        null, undefined, function () {},
        string, number, boolean, array(string), nullable(number), readonly(boolean),
        {
          name: string,
          age: boolean,
          fullname: object({
            first: string,
            last: string
          }),
          doSomething: function () {}
        }
      ].every(x => isFunctionThrowException(object, x))).toBeTruthy();
    });

    it('nullable', function () {
      const nullablePerson = nullable(person);

      expect(nullablePerson.defaultValue()).toEqual(null);

      // The `baseType` is valid.
      expect(nullablePerson.valid({ name: 'Dr. Wiley', age: 66, fullname: {first: '', last: ''} })).toBeTruthy();

      // `null` should be valid.
      expect(nullablePerson.valid(null)).toBeTruthy();

      // Anything else should fail.
      expect(nullablePerson.valid(1)).toBeFalsy();
      expect(nullablePerson.valid('string')).toBeFalsy();
      expect(nullablePerson.valid(undefined)).toBeFalsy();
    });


    it('array', function () {
      expect(all([
        array(string).valid([]),
        array(string).valid(['megaman']),
        array(number).valid([13, 37]),
        array(person).valid([{ name: 'Dr. Light', age: 74, fullname: {first: '', last: ''} }])
      ])).toBeTruthy();
    });
  });
});
