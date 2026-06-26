import { Link } from 'react-router-dom';
import { formatGradYear, truncate } from '../../utils/helpers';

export default function AlumniCard({ alumni }) {
    const { id, firstName, lastName, gradYear, company, title, bio, position, industry, skills } = alumni;

    return (
        <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                {alumni.photoUrl ? (
                    <img
                        src={alumni.photoUrl}
                        alt={`${firstName} ${lastName}`}
                        className="w-14 h-14 rounded-full object-cover shrink-0"
                    />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-aggie-blue text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {firstName?.[0]}{lastName?.[0]}
                    </div>
                )}

                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{firstName} {lastName}</h3>
                    <p className="text-sm text-aggie-blue">{title} {company && `@ ${company}`}</p>
                    {position  && <p className="text-xs text-gray-500">{position}</p>}
                    {industry  && <p className="text-xs text-gray-400">{industry}</p>}
                    <p className="text-xs text-gray-400">{formatGradYear(gradYear)}</p>
                </div>
            </div>

            {/* Skills */}
            {skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {skills.map(skill => (
                        <span
                            key={skill}
                            className="text-xs bg-aggie-light text-aggie-blue px-2 py-0.5 rounded-full"
                        >
              {skill}
            </span>
                    ))}
                </div>
            )}

            {bio && <p className="mt-3 text-sm text-gray-600">{truncate(bio)}</p>}

            <Link
                to={`/profile/${id}`}
                className="mt-4 inline-block text-sm font-medium text-aggie-blue hover:underline"
            >
                View Profile →
            </Link>
        </div>
    );
}