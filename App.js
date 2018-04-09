/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ListView,
  Button,
  TextInput,
  Form
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import { createStore, combineReducers } from 'redux'
import { Field, reduxForm, reducer as formReducer } from 'redux-form'
import { Provider } from "react-redux";

import gql from 'graphql-tag';
import ApolloClient from 'apollo-boost';
import { ApolloProvider, Query, Mutation, graphql, compose } from 'react-apollo';


const client = new ApolloClient({
  uri: "http://127.0.0.1:5000/graphql"
});

const Wrap = (props) => props.children;

const fetchAllPersons = gql`
  query {
    persons {
      uuid
      name
      age
    }
  }
`;

const GET_PERSON = gql`
  query GetPerson($id: Int) {
    person(uuid: $id) {
      uuid
      name
      age
    }
  }
`;

const DELETE_PERSON = gql`
  mutation DeletePerson($uuid: Int) {
    deletePerson(uuid: $uuid) {
      person {
        uuid
        name
        age
      }
    }
  }
`

const CREATE_PERSON = gql`
  mutation CreatePerson($name: String, $age: Int) {
    createPerson(name: $name, age: $age) {
      person {
        uuid
        name
        age
      }
    }
  }
`

const Loading = (props) => <Text>Loading...</Text>;
const Error = (props) => <Text>Error...</Text>;

const PersonList = (props) => {

  const persons = props.persons.map(person => {
    return (
      <Button
        title={person.name + "(" + person.uuid + ")"}
        key={person.uuid}
        onPress={() => {
          props.navigation.navigate('Details', { selectedUserId: person.uuid })
        }}
      />
    )
  })

  return (
    <View style={styles.container}>
      <Button
        title="Add Person"
        onPress={() => {
          props.navigation.navigate('Create')
        }}
      />
      {persons}
    </View>
  );
}

class ListScreen extends Component {
  render() {
    const { loading, error, persons } = this.props.fetchAllPersons;

    if (loading) return <Loading />;
    if (error) return <Error />;
    return <PersonList persons={persons} navigation={this.props.navigation} />;
  }
}

const ListScreenWithData = graphql(
  fetchAllPersons, {
    name: "fetchAllPersons",
    options: () => ({ fetchPolicy: "network-only" })
  }
)(ListScreen);

ErrorText = (props) => (
  <Text style={[styles.text, props.style]}>
    {props.children}
  </Text>
);


const TextFieldComponent = (fieldProps) => {
  const {
    input,
    meta: { touched, error },
    label,
    inputRef,
    disableError,
    style,
    inputStyle,
    errorStyle,
    ...inputProps
  } = fieldProps;

  const labelNode = label ? (
    <Text style={styles.label}>{label.toUpperCase()}</Text>
  ) : null;

  return (
    <View>
      <View
        style={[styles.container, style]}
      >
        {labelNode}
        <TextInput
          style={[styles.input, inputStyle]}
          autoCapitalize={"none"}
          blurOnSubmit={true}
          underlineColorAndroid="rgba(0,0,0,0)"
          ref={inputRef}
          {...input}
          {...inputProps}
        />
      </View>
      <ErrorText style={[styles.error, errorStyle]}>{touched && error}</ErrorText>
    </View>
  );
};

function TextField(props) {
  const { required, validate, ...rest } = props;
  const validators = required ? [requiredValidator] : [];

  if (validate) {
    if (Array.isArray(validate)) {
      validators.concat(validate);
    } else {
      validators.push(validate);
    }
  }

  return (
    <Field
      component={TextFieldComponent}
      // placeholderTextColor={palette.grey}
      validate={validators}
      {...rest}
    />
  );
};

class CreatePersonForm extends Component {
  render() {
    // const { handleSubmit } = props;
    console.log(">>>>", this);
    return (
      <Mutation mutation={DELETE_PERSON}>
        {createPerson => (
          <View style={styles.container}>
            <TextField
              label={"Name"}
              name={"name"}
              placeholder={"Enter your name"}
            />
            <Button
              title="Create"
              onPress={
                () => {
                  console.log(">>>>", this)
                  // createPerson({ variables: { uuid: this.props.uuid } });
                  // this.props.navigation.goBack();
                }
              }
            />
          </View>
        )}
      </Mutation>
    );
  }
}

const rootReducer = combineReducers({
  form: formReducer
})

const store = createStore(rootReducer)

CreatePersonForm = reduxForm({
  form: 'createPerson'
})(CreatePersonForm)

class CreateScreen extends Component {
  render() {
    return (
      <CreatePersonForm />
    )
  }
}

store.subscribe(() => { console.log(store.getState()) });

class DetailsScreen extends Component {
  render() {
    const selectedUserId = this.props.navigation.state.params.selectedUserId;

    return (
      <View style={styles.container}>
        <Query query={GET_PERSON} variables={{ id: selectedUserId }}>
          {({ loading, error, data }) => {

            if (loading) return <Loading />;
            if (error) return <Error />;

            return (
              <Wrap>
                <Text style={styles.welcome}>
                  Id: {data.person.uuid}
                </Text>
                <Text style={styles.welcome}>
                  Name: {data.person.name}
                </Text>
                <Text style={styles.welcome}>
                  Age: {data.person.age}
                </Text>
                <DeletePersonButton uuid={data.person.uuid} navigation={this.props.navigation} />
              </Wrap>
            )

          }}
        </Query>
      </View >
    );
  }
}

class DeletePersonButton extends Component {
  render() {
    return (
      <Mutation mutation={DELETE_PERSON}>
        {deletePerson => (
          <Button
            title="Delete"
            onPress={
              () => {
                deletePerson({ variables: { uuid: this.props.uuid } });
                this.props.navigation.goBack();
              }
            }
          />
        )}
      </Mutation>
    )
  }
}

const RootStack = StackNavigator(
  {
    List: {
      screen: ListScreenWithData,
    },
    Details: {
      screen: DetailsScreen,
    },
    Create: {
      screen: CreateScreen,
    },
  },
  {
    initialRouteName: 'List',
  }
);

export default class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <Provider store={store}>
          <RootStack />
        </Provider>
      </ApolloProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});
