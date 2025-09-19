[iscript]

f.hoge = {
    foo: "bar",
    baz: "qux"
};

f.another = {
    prop1: "value1",
    prop2: {
        nested: "deeply"
    }
};

// Additional test case for f.hoge.foo
f.hoge.foo = {
    deep1: "value1",
    deep2: "value2"
};

[endscript]

; Testing completion for f.hoge.
; Should show foo and baz as completion options
; Testing f.another.prop2.
; Should show nested as completion option
; Testing f.hoge.foo.
; Should show deep1 and deep2 as completion options