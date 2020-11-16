import { observable, action, computed, runInAction, reaction } from 'mobx'
import { SyntheticEvent } from 'react'
import { IActivity, IAttendee } from '../models/activity';
import agent from '../api/agent';
import { history } from '../..';
import { toast } from 'react-toastify';
import { RootStore } from './rootStore';
import { createAttendee, setActivityProps } from '../common/util/util';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const LIMIT = 5;

export default class ActivityStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;

        reaction(
            () => this.predicate.keys(),
            () => {
                this.page = 0;
                this.activityRegistry.clear();
                this.loadActivities();
            }
        )
    }

    @observable activityRegistry = new Map();
    @observable activity: IActivity | null | undefined;
    @observable loadingInitial = false;
    @observable loading = false;
    @observable submitting = false;
    @observable target = '';
    @observable.ref hunConnection: HubConnection | null = null;
    @observable activityCount = 0;
    @observable page = 0;
    @observable predicate = new Map();

    @computed get activitiesByDate() {
        return this.groupActivitiesbyDate(Array.from(this.activityRegistry.values()));
    }

    @computed get totalPages() {
        return Math.ceil(this.activityCount / LIMIT);
    }

    @computed get axiosParams() {
        const params = new URLSearchParams();
        params.append('limit', String(LIMIT));
        params.append('offset', `${this.page ? this.page * LIMIT : 0}`);
        this.predicate.forEach((value, key) => {
            if (key === 'startDate') {
                params.append(key, value.toISOString())
            } else {
                params.append(key, value);
            }
        });

        return params;
    }

    @action setPredicate = (predicate: string, value: string | Date) => {
        this.predicate.clear();
        if (predicate !== 'all') {
            this.predicate.set(predicate, value);
        }
    }

    @action setPage = (page: number) => {
        this.page = page;
    }

    @action createHubConnection = (activityId: string) => {
        this.hunConnection = new HubConnectionBuilder()
            .withUrl('https://localhost:5001/chat', {
                accessTokenFactory: () => this.rootStore.commonStore.token!
            })
            .configureLogging(LogLevel.Information)
            .build();

        this.hunConnection.start()
            .then(() => console.log(this.hunConnection!.state))
            .then(() => {
                console.log("joining group");
                this.hunConnection?.invoke('AddToGroup', activityId);
            })
            .catch((error) => console.log(error));

        this.hunConnection.on('ReceiveComment', comment => {
            runInAction(() => {
                this.activity!.comments.push(comment);
            });
        });
    }

    @action stopHubConnection = () => {
        this.hunConnection?.invoke('RemoveFromGroup', this.activity!.id)
            .then(() => {
                this.hunConnection!.stop();
            })
            .catch(error => console.log(error));
    }

    @action addComment = async (values: any) => {
        values.activityId = this.activity!.id;
        try {
            await this.hunConnection!.invoke('SendComment', values);
        } catch (error) {
            console.log(error);
        }
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        const user = this.rootStore.userStore.user;
        try {
            const activitiesEnvelope = await agent.Activities.list(this.axiosParams);
            const { activities, count } = activitiesEnvelope;
            runInAction('loading activities', () => {
                activities.forEach((activity) => {
                    setActivityProps(activity, user!);
                    this.activityRegistry.set(activity.id, activity);
                });
                this.activityCount = count;
                this.loadingInitial = false;
            })
        } catch (error) {
            runInAction('loading activities error', () => {
                this.loadingInitial = false;
            })
            console.log(error);
        }
    }

    @action loadActivity = async (id: string) => {
        let activity = this.getActivity(id);
        const user = this.rootStore.userStore.user;

        if (activity) {
            this.activity = activity;
            return activity;
        } else {
            this.loadingInitial = true;
            try {
                activity = await agent.Activities.details(id);
                runInAction('get activity', () => {
                    setActivityProps(activity, user!);
                    this.activity = activity;
                    this.activityRegistry.set(activity.id, activity);
                    this.loadingInitial = false;
                });
                return activity;
            }
            catch (error) {
                runInAction('get activity error', () => {
                    this.loadingInitial = false;
                });
            }
        }
    }

    @action clearActivity = () => {
        this.activity = null;
    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        const attendee = createAttendee(this.rootStore.userStore.user!);
        attendee.isHost = true;
        let attendees: IAttendee[] = [];
        attendees.push(attendee);
        activity.attendees = attendees;
        activity.comments = [];
        activity.isHost = true;

        try {
            await agent.Activities.create(activity);

            runInAction('create activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.submitting = false;
            });

            history.push(`/activities/${activity.id}`);
        } catch (error) {
            runInAction('create activity error', () => {
                this.submitting = false;
            });
            toast.error('Problem submitting data');
        }
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);

            runInAction('edidit activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.activity = activity;
                this.submitting = false;
            });

            history.push(`/activities/${activity.id}`);
        } catch (error) {
            runInAction('edidit activity', () => {
                this.submitting = false;
            });
            console.log(error);
        }
    }

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        try {
            await agent.Activities.delete(id);

            runInAction('delete activity', () => {
                this.activityRegistry.delete(id);
                this.submitting = false;
                this.target = '';
            });
        } catch (error) {
            runInAction('delete activity', () => {
                this.submitting = false;
            });

            console.log(error);
        }
    }

    @action attendActivity = async () => {
        const attendee = createAttendee(this.rootStore.userStore.user!);
        this.loading = true;

        try {
            await agent.Activities.attend(this.activity!.id);

            runInAction('attend activity', () => {
                if (this.activity) {
                    this.activity.attendees.push(attendee);
                    this.activity.isGoing = true;
                    this.activityRegistry.set(this.activity.id, this.activity);
                    this.loading = false;
                }
            })
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            toast.error("Problem signing up to activity")
        }
    }

    @action cancelAttendance = async () => {
        this.loading = true;

        try {
            await agent.Activities.unattend(this.activity!.id);

            runInAction('unattend activity', () => {
                if (this.activity) {
                    this.activity.attendees = this.activity.attendees.filter(a => a.userName !== this.rootStore.userStore.user!.userName);
                    this.activity.isGoing = false;
                    this.activityRegistry.set(this.activity.id, this.activity);
                    this.loading = false;
                }
            })

        } catch (error) {
            runInAction(() => {
                this.loading = false;
            })
            toast.error("Problem cancelling attendance")
        }
    }

    getActivity = (id: string) => {
        return this.activityRegistry.get(id);
    }

    groupActivitiesbyDate = (activities: IActivity[]) => {
        const sortedActivities = activities.sort((a, b) => a.date.getTime() - b.date.getTime());

        return Object.entries(sortedActivities.reduce((activities, activity) => {
            const date = activity.date.toISOString().split('T')[0];

            activities[date] = activities[date] ? [...activities[date], activity] : [activity];
            return activities;
        }, {} as { [key: string]: IActivity[] }));
    }
}