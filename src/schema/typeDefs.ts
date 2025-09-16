import { gql } from "apollo-server-express";

export const typeDefs = gql`
  enum Role {
    ADMIN
    MANAGER
    MEMBER
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    teams: [Team!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    me: User
    users: [User!]!
  }

  type Team {
    id: ID!
    name: String!
    members: [User!]!
    createdBy: User!
    projects: [Project!]!
    createdAt: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    name: String!
    team: Team!
    tasks: [Task!]!
    createdAt: String!
    updatedAt: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    dueDate: String
    project: Project!
    assignee: User
    comments: [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    task: Task!
    createdAt: String!
    updatedAt: String!
  }

  type TaskPage {
    items: [Task!]!
    page: Int!
    limit: Int
    totalItems: Int!
    totalPages: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input TaskInput {
    title: String!
    description: String
    status: TaskStatus
    assigneeId: ID
    dueDate: String
  }

input TaskUpdateInput {
  title: String
  description: String
  status: TaskStatus
  assigneeId: ID
  dueDate: String # Add this field
  comments: String # Add this field
}

  type Query {
    me: User
    teams: [Team!]!
    projects(teamId: ID!): [Project!]!
    tasks(
      projectId: ID!
      page: Int = 1
      limit: Int = 30
      status: TaskStatus
      ): TaskPage!
      myTasks: [Task!]!
    task(id: ID!): Task
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    updateUser(userId: ID!, name: String, role: Role): User!

   createTeam(name: String!, members: [ID!]): Team!
    addUserToTeam(teamId: ID!, userId: ID!): Team!
    removeUserFromTeam(teamId: ID!, userId: ID!): Team!

    createProject(teamId: ID!, name: String!): Project!

    createTask(projectId: ID!, input: TaskInput!): Task!
    assignTask(taskId: ID!, userId: ID!): Task!
    updateTask(id: ID!, input: TaskUpdateInput!): Task!
    deleteTask(id: ID!): Boolean!

    addComment(taskId: ID!, text: String!): Comment!
  }
`;
