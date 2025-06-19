export interface IGroupCreate {
  name: string
  ownerId: string
  members: string[]
}

export interface IGroup {
  _id: string
  name: string
  ownerId: string
}

export interface IGroupMember {
  userId: string
  groupId: string
  role: 'admin' | 'member'
  tags: string[]
}
